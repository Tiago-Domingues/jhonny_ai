import "dotenv/config";
import { createScriptPrismaClient } from "./prisma-client.mjs";

const prisma = createScriptPrismaClient();

/**
 * Retire the old fixed prize-wheel coupon.
 *
 * The wheel used to hand everyone the same "RODA10" code. Now that each spin
 * mints its own single-use code, leaving the fixed one active would keep a
 * permanently valid 10% discount that anyone can type without ever spinning.
 *
 * Only the bare code is touched: per-spin codes look like "RODA10-7K3QP1" and
 * are matched by their own unique rows, never by this exact-code lookup.
 * Deactivating rather than deleting keeps redemption history intact.
 */
const FIXED_CODE = "RODA10";

async function main() {
  const existing = await prisma.coupon.findUnique({ where: { code: FIXED_CODE } });

  if (!existing) {
    console.log(`No fixed ${FIXED_CODE} coupon present — nothing to retire.`);
    return;
  }

  if (!existing.active) {
    console.log(`${FIXED_CODE} is already retired.`);
    return;
  }

  await prisma.coupon.update({
    where: { code: FIXED_CODE },
    data: { active: false, label: `${existing.label} (retired)` },
  });
  console.log(`Retired the fixed ${FIXED_CODE} coupon.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
