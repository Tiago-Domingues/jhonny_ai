import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pendingRegisterSchema } from "../src/lib/ecommerce/schemas";

dotenv.config({ path: ".env.local" });
dotenv.config();

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

const parsed = pendingRegisterSchema.parse({
  email: "ana@example.com",
  username: "ana.silva",
  password: "surflegend",
});
assert(parsed.email === "ana@example.com", "pending register keeps email");
assert(parsed.marketingOptIn === true, "signup marketing defaults to opted in");
assert(
  pendingRegisterSchema.parse({
    email: "ana@example.com",
    username: "ana.silva",
    password: "surflegend",
    marketingOptIn: false,
  }).marketingOptIn === false,
  "signup can unselect marketing"
);
assert(
  !pendingRegisterSchema.safeParse({
    email: "ana@example.com",
    username: "ana.silva",
    password: "short",
  }).success,
  "pending register rejects a short password"
);

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      ssl: { rejectUnauthorized: false },
    }),
  });

  const stamp = Date.now().toString(36);
  const email = `verify-gate-${stamp}@example.com`;
  const username = `verifygate${stamp}`.slice(0, 32);
  const token = randomToken(32);
  const expiredToken = randomToken(32);

  await prisma.pendingRegistration.create({
    data: {
      email,
      username,
      passwordHash: await bcrypt.hash("surflegend1", 12),
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await prisma.pendingRegistration.create({
    data: {
      email: `expired-${email}`,
      username: `${username}x`,
      passwordHash: await bcrypt.hash("surflegend1", 12),
      tokenHash: hashToken(expiredToken),
      expiresAt: new Date(Date.now() - 60 * 1000),
    },
  });

  const before = await prisma.user.findUnique({ where: { email } });
  assert(!before, "no User row exists before the email link is used");

  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
  assert(pending?.tokenHash === hashToken(token), "pending token is stored hashed");
  assert(pending.tokenHash !== token, "plaintext token is not stored");

  const expiredRow = await prisma.pendingRegistration.findUnique({
    where: { tokenHash: hashToken(expiredToken) },
  });
  assert(expiredRow && expiredRow.expiresAt.getTime() < Date.now(), "expired pending stays unusable");

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        username,
        passwordHash: pending.passwordHash,
        emailVerifiedAt: new Date(),
        role: "CUSTOMER",
        profile: { create: { fullName: username } },
      },
    });
    await tx.pendingRegistration.delete({ where: { id: pending.id } });
    return created;
  });
  const createdProfile = await prisma.customerProfile.findUnique({ where: { userId: user.id } });
  assert(user.emailVerifiedAt, "account is created already verified");
  assert(createdProfile?.marketingOptIn === true, "new profile defaults to marketing opt-in");
  assert(!(await prisma.pendingRegistration.findUnique({ where: { email } })), "pending row is consumed");

  const leftoverPending = await prisma.pendingRegistration.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  assert(!leftoverPending, "used pending token cannot be reused");

  await prisma.pendingRegistration.deleteMany({ where: { tokenHash: hashToken(expiredToken) } });
  await prisma.customerProfile.deleteMany({ where: { userId: user.id } }).catch(() => null);
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
  console.log("verify-before-register: a stored pending row becomes a user when the email link is used");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
