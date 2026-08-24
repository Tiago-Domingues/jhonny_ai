import "dotenv/config";
import { createScriptPrismaClient } from "./prisma-client.mjs";

const prisma = createScriptPrismaClient();

/**
 * Prize handed out by the corner-ribbon spin wheel.
 *
 * Deliberately not a welcome coupon: `isWelcomeCoupon` in
 * src/lib/ecommerce/coupons.ts gates those behind a signed-in user with no
 * paid orders, which would make the wheel hand returning customers a code
 * that fails at checkout.
 */
async function main() {
  const coupon = await prisma.coupon.upsert({
    where: { code: "RODA10" },
    update: {
      label: "Spin the wheel discount",
      percentOff: 10,
      active: true,
      maxUsesPerCustomer: 1,
    },
    create: {
      code: "RODA10",
      label: "Spin the wheel discount",
      percentOff: 10,
      active: true,
      maxUsesPerCustomer: 1,
    },
  });

  console.log(`Seeded spin wheel coupon ${coupon.code} (${coupon.percentOff}% off).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
