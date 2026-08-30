/**
 * Checkout + wheel coupon rules.
 *
 * Covers invented codes, account binding, one-time use, JHONNY10 first-order
 * only, and one spin per month. Uses the local database; no Odoo.
 *
 * Run: cd website && npm run test:coupon-rules
 */
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import {
  currentPeriodKey,
  generateWheelCode,
  persistWheelCode,
} from "../src/lib/ecommerce/prizeWheel";

dotenv.config({ path: ".env.local" });
dotenv.config();

const shim = join(dirname(fileURLToPath(import.meta.url)), "shims/server-only.js");
const resolveFilename = (Module as typeof Module & {
  _resolveFilename: (...args: unknown[]) => string;
})._resolveFilename;
(Module as typeof Module & { _resolveFilename: (...args: unknown[]) => string })._resolveFilename =
  function patchedResolve(request: string, ...rest: unknown[]) {
    if (request === "server-only") return shim;
    return resolveFilename.call(this, request, ...rest);
  };

let checks = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
  checks += 1;
}

async function expectReject(label: string, fn: () => Promise<unknown>, match: RegExp) {
  try {
    await fn();
    throw new Error(`${label}: expected a rejection`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === `${label}: expected a rejection`) throw error;
    assert(match.test(message), `${label}: unexpected message "${message}"`);
  }
}

function createPrisma() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const needsSsl =
    connectionString.includes("sslmode=") ||
    connectionString.includes("db.prisma.io") ||
    connectionString.includes("prisma.io");
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    }),
  });
}

async function main() {
  const { validateCoupon } = await import("../src/lib/ecommerce/coupons");
  const { spinWheel } = await import("../src/lib/ecommerce/wheelSpins");

  const prisma = createPrisma();
  const stamp = Date.now().toString(36);
  const winnerEmail = `coupon-winner-${stamp}@example.com`;
  const otherEmail = `coupon-other-${stamp}@example.com`;
  const spinnerEmail = `coupon-spinner-${stamp}@example.com`;
  const firstOrderEmail = `coupon-first-${stamp}@example.com`;
  const createdCouponCodes: string[] = [];
  const createdUserIds: string[] = [];
  const createdOrderIds: string[] = [];

  try {
    await prisma.coupon.upsert({
      where: { code: "JHONNY10" },
      update: { active: true, percentOff: 10, maxUsesPerCustomer: 1 },
      create: {
        code: "JHONNY10",
        label: "First purchase welcome discount",
        percentOff: 10,
        active: true,
        maxUsesPerCustomer: 1,
      },
    });

    const winner = await prisma.user.create({
      data: { email: winnerEmail, username: `tiago.domingues.${stamp}` },
    });
    const other = await prisma.user.create({
      data: { email: otherEmail, username: `other.${stamp}` },
    });
    const spinner = await prisma.user.create({
      data: { email: spinnerEmail, username: `spinner.${stamp}` },
    });
    const firstOrderUser = await prisma.user.create({
      data: { email: firstOrderEmail, username: `first.${stamp}` },
    });
    createdUserIds.push(winner.id, other.id, spinner.id, firstOrderUser.id);

    const periodKey = "2026-08";
    const minted: { percent: number; code: string; couponId: string }[] = [];

    for (const percent of [5, 10, 20] as const) {
      const display = generateWheelCode({
        percent,
        periodKey,
        username: winner.username,
      });
      const code = persistWheelCode(display);
      createdCouponCodes.push(code);
      const coupon = await prisma.coupon.create({
        data: {
          code,
          label: `Prize wheel ${percent}% (${periodKey})`,
          percentOff: percent,
          active: true,
          maxUses: 1,
          maxUsesPerCustomer: 1,
          expiresAt: new Date("2026-08-31T22:59:59.999Z"),
          wheelSpin: {
            create: {
              userId: winner.id,
              periodKey: `${periodKey}-${percent}`,
              prizePercent: percent,
              code,
            },
          },
        },
      });
      minted.push({ percent, code, couponId: coupon.id });

      const applied = await validateCoupon(display, 10_000, { userId: winner.id });
      assert(applied?.percentOff === percent, `${percent}% minted code should apply`);
      assert(applied.discountCents === percent * 100, `${percent}% discount cents`);

      const upper = await validateCoupon(code, 10_000, { userId: winner.id });
      assert(upper?.code === code, `${percent}% uppercase form should apply`);

      await expectReject(
        `${percent}% guest`,
        () => validateCoupon(code, 10_000, {}),
        /sign in/i
      );
      await expectReject(
        `${percent}% other account`,
        () => validateCoupon(code, 10_000, { userId: other.id }),
        /another account/i
      );
    }

    await expectReject(
      "invented new-shape",
      () => validateCoupon("roda-20%-august-2026-nobody", 10_000, { userId: winner.id }),
      /not found/i
    );
    await expectReject(
      "invented legacy",
      () => validateCoupon("RODA20-FAKE01", 10_000, { userId: winner.id }),
      /not found/i
    );
    await expectReject(
      "empty cart",
      () => validateCoupon("JHONNY10", 0, { userId: firstOrderUser.id }),
      /non-empty cart/i
    );
    await expectReject(
      "JHONNY10 guest",
      () => validateCoupon("JHONNY10", 10_000, {}),
      /sign in/i
    );

    const welcome = await validateCoupon("JHONNY10", 10_000, { userId: firstOrderUser.id });
    assert(welcome?.percentOff === 10, "JHONNY10 should apply on a first paid order");

    const paidWelcome = await prisma.order.create({
      data: {
        orderNumber: `JSS-TEST-WELCOME-${stamp}`,
        userId: firstOrderUser.id,
        customerEmail: firstOrderEmail,
        customerName: "First Order",
        status: "PAID",
        subtotalCents: 10_000,
        totalCents: 9_000,
        couponCode: "JHONNY10",
      },
    });
    createdOrderIds.push(paidWelcome.id);

    await expectReject(
      "JHONNY10 after paid",
      () => validateCoupon("JHONNY10", 10_000, { userId: firstOrderUser.id }),
      /first paid order/i
    );

    const expiredCode = persistWheelCode(
      generateWheelCode({ percent: 20, periodKey: "2020-01", username: winner.username })
    );
    createdCouponCodes.push(expiredCode);
    await prisma.coupon.create({
      data: {
        code: expiredCode,
        label: "Expired wheel",
        percentOff: 20,
        active: true,
        maxUses: 1,
        maxUsesPerCustomer: 1,
        expiresAt: new Date("2020-01-31T23:59:59.999Z"),
        wheelSpin: {
          create: {
            userId: winner.id,
            periodKey: "2020-01",
            prizePercent: 20,
            code: expiredCode,
          },
        },
      },
    });
    await expectReject(
      "expired",
      () => validateCoupon(expiredCode, 10_000, { userId: winner.id }),
      /expired/i
    );

    const inactiveCode = persistWheelCode(
      generateWheelCode({ percent: 10, periodKey: "2026-02", username: winner.username })
    );
    createdCouponCodes.push(inactiveCode);
    await prisma.coupon.create({
      data: {
        code: inactiveCode,
        label: "Inactive wheel",
        percentOff: 10,
        active: false,
        maxUses: 1,
        maxUsesPerCustomer: 1,
        wheelSpin: {
          create: {
            userId: winner.id,
            periodKey: "2026-02",
            prizePercent: 10,
            code: inactiveCode,
          },
        },
      },
    });
    await expectReject(
      "inactive",
      () => validateCoupon(inactiveCode, 10_000, { userId: winner.id }),
      /not found|inactive/i
    );

    const used = minted[2]!;
    const usedOrder = await prisma.order.create({
      data: {
        orderNumber: `JSS-TEST-WHEEL-${stamp}`,
        userId: winner.id,
        customerEmail: winnerEmail,
        customerName: "Winner",
        status: "PAID",
        subtotalCents: 10_000,
        discountCents: 2_000,
        totalCents: 8_000,
        couponCode: used.code,
        couponUsage: {
          create: {
            couponId: used.couponId,
            userId: winner.id,
            code: used.code,
            discountCents: 2_000,
            subtotalCents: 10_000,
          },
        },
      },
    });
    createdOrderIds.push(usedOrder.id);

    await expectReject(
      "second use",
      () => validateCoupon(used.code, 10_000, { userId: winner.id }),
      /usage limit|already used/i
    );

    const first = await spinWheel(spinner.id);
    assert(first.eligible === false && first.prize, "first spin should mint a prize");
    assert(
      first.prize.code ===
        persistWheelCode(
          generateWheelCode({
            percent: first.prize.percent,
            periodKey: currentPeriodKey(),
            username: spinner.username,
          })
        ),
      `minted code ${first.prize.code} did not match username/month/percent`
    );
    createdCouponCodes.push(first.prize.code);

    const couponRow = await prisma.coupon.findUnique({ where: { code: first.prize.code } });
    assert(couponRow?.maxUses === 1, "minted coupon maxUses must be 1");
    assert(couponRow?.maxUsesPerCustomer === 1, "minted coupon maxUsesPerCustomer must be 1");
    assert(couponRow?.percentOff === first.prize.percent, "minted percent must match the prize");

    const second = await spinWheel(spinner.id);
    assert(second.prize?.code === first.prize.code, "second spin must return the same code");
    const spinCount = await prisma.wheelSpin.count({
      where: { userId: spinner.id, periodKey: currentPeriodKey() },
    });
    assert(spinCount === 1, `expected one spin row, got ${spinCount}`);

    const liveApply = await validateCoupon(first.prize.code, 10_000, { userId: spinner.id });
    assert(liveApply?.percentOff === first.prize.percent, "minted spin should validate for the winner");
    await expectReject(
      "stolen live spin",
      () => validateCoupon(first.prize!.code, 10_000, { userId: other.id }),
      /another account/i
    );

    console.log(`\nCoupon rule checks passed (${checks} assertions).`);
  } finally {
    await prisma.couponUsage.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
    await prisma.wheelSpin.deleteMany({
      where: { OR: [{ userId: { in: createdUserIds } }, { code: { in: createdCouponCodes } }] },
    });
    if (createdCouponCodes.length) {
      await prisma.coupon.deleteMany({ where: { code: { in: createdCouponCodes } } });
    }
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
