/**
 * Local-only helper: create verified test accounts for exercising the prize
 * wheel end to end. Refuses to run against a non-local database.
 *
 * Usage: cd website && node scripts/seed-test-users.mjs
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { createScriptPrismaClient } from "./prisma-client.mjs";

const url = process.env.DATABASE_URL || "";
if (!/(localhost|127\.0\.0\.1)/.test(url)) {
  console.error("Refusing to seed test users into a non-local database.");
  process.exit(1);
}

const prisma = createScriptPrismaClient();

const USERS = [
  { email: "wheel1@example.com", username: "wheel1", fullName: "Wheel One" },
  { email: "wheel2@example.com", username: "wheel2", fullName: "Wheel Two" },
];

const PASSWORD = "TestPass123!";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const user of USERS) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, emailVerifiedAt: new Date() },
      create: {
        email: user.email,
        username: user.username,
        passwordHash,
        emailVerifiedAt: new Date(),
        profile: { create: { fullName: user.fullName } },
      },
    });
    console.log(`Seeded ${record.email} (password: ${PASSWORD})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
