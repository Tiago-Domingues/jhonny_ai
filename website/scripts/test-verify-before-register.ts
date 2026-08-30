import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
assert(parsed.phoneCountryCode === "+351", "pending register defaults to Portugal dial code");
assert(
  pendingRegisterSchema.parse({
    email: "ana@example.com",
    username: "ana.silva",
    password: "surflegend",
    phoneCountryCode: "+351",
    phone: "912345678",
  }).phone === "912345678",
  "pending register keeps an optional mobile"
);
assert(
  !pendingRegisterSchema.safeParse({
    email: "ana@example.com",
    username: "ana.silva",
    password: "short",
  }).success,
  "pending register rejects a short password"
);

const verifyClient = readFileSync(resolve(__dirname, "../src/components/VerifyEmailClient.tsx"), "utf8");
assert(verifyClient.includes("started.current"), "verify page posts the token only once");
assert(verifyClient.includes("locale copy must not retrigger"), "locale changes must not resend the token");

const verifyEmail = readFileSync(resolve(__dirname, "../src/lib/ecommerce/email.ts"), "utf8");
assert(verifyEmail.includes("word-break:break-all"), "verification email includes a pasteable URL");

const proxySource = readFileSync(resolve(__dirname, "../src/proxy.ts"), "utf8");
assert(proxySource.includes("isPublicEmailAuthPath"), "coming-soon proxy lets email auth links through");

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
      phoneCountryCode: "+351",
      phone: "912345678",
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
  assert(pending.phone === "912345678", "pending registration stores the mobile for welcome SMS");

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
        profile: { create: { fullName: username, phoneCountryCode: pending.phoneCountryCode, phone: pending.phone } },
      },
    });
    await tx.emailVerificationToken.create({
      data: {
        userId: created.id,
        tokenHash: hashToken(token),
        expiresAt: pending.expiresAt,
        usedAt: new Date(),
      },
    });
    await tx.pendingRegistration.delete({ where: { id: pending.id } });
    return created;
  });
  assert(user.emailVerifiedAt, "account is created already verified");
  assert(!(await prisma.pendingRegistration.findUnique({ where: { email } })), "pending row is consumed");

  const leftoverPending = await prisma.pendingRegistration.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  assert(!leftoverPending, "pending token row is removed after the account exists");

  const replay = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  assert(replay?.usedAt, "used verify token is kept so a second click can succeed");
  assert(replay.userId === user.id, "replay token still points at the new account");
  assert(replay.user.emailVerifiedAt, "replay of a used link still finds a verified account");

  await prisma.pendingRegistration.deleteMany({ where: { tokenHash: hashToken(expiredToken) } });
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await prisma.customerProfile.deleteMany({ where: { userId: user.id } }).catch(() => null);
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
  console.log("verify-before-register: pending is not a user until the email link is used");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
