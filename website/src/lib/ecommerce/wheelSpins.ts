import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import {
  currentPeriodKey,
  drawPrize,
  generateWheelCode,
  periodExpiresAt,
  segmentForPercent,
} from "@/lib/ecommerce/prizeWheel";

export type WheelStatus = {
  periodKey: string;
  /** False once the month's spin has been used; the wheel still opens, but stops awarding. */
  eligible: boolean;
  prize: { percent: number; code: string; segmentIndex: number; expiresAt: string } | null;
};

const UNIQUE_VIOLATION = "P2002";
const CODE_ATTEMPTS = 5;

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

  const { percent, segmentIndex } = drawPrize();
  const expiresAt = periodExpiresAt(periodKey);

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const code = generateWheelCode(percent);

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

      // Either the month was claimed by a concurrent request, or the generated
      // code collided. Only the former leaves a row behind.
      const claimed = await prisma.wheelSpin.findUnique({
        where: { userId_periodKey: { userId, periodKey } },
        select: { prizePercent: true, code: true },
      });
      if (claimed) {
        return { periodKey, eligible: false, prize: toPrize(claimed, periodKey) };
      }
    }
  }

  throw new Error("Could not allocate a unique coupon code. Please try again.");
}
