import "dotenv/config";
import { createScriptPrismaClient } from "./prisma-client.mjs";

const prisma = createScriptPrismaClient();

async function main() {
  const coupon = await prisma.coupon.upsert({
    where: { code: "JHONNY10" },
    update: {
      label: "First purchase welcome discount",
      percentOff: 10,
      active: true,
      maxUsesPerCustomer: 1,
    },
    create: {
      code: "JHONNY10",
      label: "First purchase welcome discount",
      percentOff: 10,
      active: true,
      maxUsesPerCustomer: 1,
    },
  });

  console.log(`Seeded welcome coupon ${coupon.code} (${coupon.percentOff}% off).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
