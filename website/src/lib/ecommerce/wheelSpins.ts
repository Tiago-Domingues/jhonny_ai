import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import {
  currentPeriodKey,
  drawPrize,
  generateWheelCode,
  periodExpiresAt,
  persistWheelCode,
  segmentForPercent,
} from "@/lib/ecommerce/prizeWheel";

export type WheelStatus = {
  periodKey: string;
  /** False once the month's spin has been used; the wheel still opens, but stops awarding. */
  eligible: boolean;
  prize: { percent: number; code: string; segmentIndex: number; expiresAt: string } | null;
};

const UNIQUE_VIOLATION = "P2002";

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === UNIQUE_VIOLATION
  );
}

function toPrize(spin: { prizePercent: number; code: string }, periodKey: string) {
  return {
    percent: spin.prizePercent,
    code: spin.code,
    segmentIndex: segmentForPercent(spin.prizePercent),
    expiresAt: periodExpiresAt(periodKey).toISOString(),
  };
}

export async function readWheelStatus(userId: string): Promise<WheelStatus> {
  const periodKey = currentPeriodKey();
  const spin = await prisma.wheelSpin.findUnique({
    where: { userId_periodKey: { userId, periodKey } },
    select: { prizePercent: true, code: true },
  });

  return {
    periodKey,
    eligible: spin === null,
    prize: spin ? toPrize(spin, periodKey) : null,
  };
}

/**
 * Draw this month's prize and mint the coupon that carries it.
 *
 * The prize is decided here rather than in the browser: the wheel awards up to
 * 20%, so a client-side draw would let anyone hand themselves the top prize.
 *
 * Returns the existing spin untouched when the month is already used, which is
 * also how the unique (userId, periodKey) constraint surfaces if two requests
 * race each other.
 */
export async function spinWheel(userId: string): Promise<WheelStatus> {
  const periodKey = currentPeriodKey();

  const existing = await prisma.wheelSpin.findUnique({
    where: { userId_periodKey: { userId, periodKey } },
    select: { prizePercent: true, code: true },
  });
  if (existing) {
    return { periodKey, eligible: false, prize: toPrize(existing, periodKey) };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  if (!user?.username) {
    throw new Error("Account is missing a username.");
  }

  const { percent, segmentIndex } = drawPrize();
  const expiresAt = periodExpiresAt(periodKey);
  const code = persistWheelCode(
    generateWheelCode({ percent, periodKey, username: user.username })
  );

  try {
    const spin = await prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.create({
        data: {
          code,
          label: `Prize wheel ${percent}% (${periodKey})`,
          percentOff: percent,
          active: true,
          maxUses: 1,
          maxUsesPerCustomer: 1,
          expiresAt,
        },
      });

      return tx.wheelSpin.create({
        data: {
          userId,
          periodKey,
          prizePercent: percent,
          couponId: coupon.id,
          code: coupon.code,
        },
        select: { prizePercent: true, code: true },
      });
    });

    return {
      periodKey,
      eligible: false,
      prize: { ...toPrize(spin, periodKey), segmentIndex },
    };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    // A concurrent request claimed the month. Return that prize untouched.
    const claimed = await prisma.wheelSpin.findUnique({
      where: { userId_periodKey: { userId, periodKey } },
      select: { prizePercent: true, code: true },
    });
    if (claimed) {
      return { periodKey, eligible: false, prize: toPrize(claimed, periodKey) };
    }
    throw error;
  }
}
