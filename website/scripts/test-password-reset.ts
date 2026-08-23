import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

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

async function resetPasswordWithToken(
  prisma: PrismaClient,
  token: string,
  password: string
) {
  const tokenHash = hashToken(token);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    throw new Error("This reset link is invalid or has expired.");
  }
  if (!row.user.passwordHash) {
    throw new Error("This account uses Google sign-in.");
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await bcrypt.hash(password, 12) },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

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
  const email = `ops-pack-reset-${stamp}@example.com`;
  const username = `opsreset${stamp}`.slice(0, 32);
  const oldPassword = "oldsurflegend";
  const newPassword = "newsurflegend";
  const token = randomToken(32);
  const expiredToken = randomToken(32);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: await bcrypt.hash(oldPassword, 12),
      role: "CUSTOMER",
      profile: {
        create: { fullName: "Ops Pack Reset", preferredLanguage: "pt" },
      },
    },
  });

  const stored = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  assert(stored.tokenHash !== token, "reset token is not stored plaintext");
  assert(stored.tokenHash === hashToken(token), "stored hash matches sha256 of the token");
  assert(!stored.tokenHash.includes(token.slice(0, 8)), "plaintext token fragment is not stored");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(expiredToken),
      expiresAt: new Date(Date.now() - 60 * 1000),
    },
  });

  try {
    await resetPasswordWithToken(prisma, expiredToken, newPassword);
    throw new Error("expired token should have failed");
  } catch (error) {
    assert(String(error).includes("invalid or has expired"), "expired token is rejected");
  }

  await resetPasswordWithToken(prisma, token, newPassword);
  const updated = await prisma.user.findUnique({ where: { id: user.id } });
  assert(updated?.passwordHash && (await bcrypt.compare(newPassword, updated.passwordHash)), "login hash matches the new password");
  assert(!(await bcrypt.compare(oldPassword, updated.passwordHash)), "old password no longer works");

  try {
    await resetPasswordWithToken(prisma, token, "anotherpassword");
    throw new Error("used token should have failed");
  } catch (error) {
    assert(String(error).includes("invalid or has expired"), "used token is rejected");
  }

  const googleUser = await prisma.user.create({
    data: {
      email: `ops-pack-google-${stamp}@example.com`,
      username: `opsgoogle${stamp}`.slice(0, 32),
      passwordHash: null,
      role: "CUSTOMER",
      profile: { create: { fullName: "Google Only", preferredLanguage: "pt" } },
    },
  });
  const googleToken = randomToken(32);
  await prisma.passwordResetToken.create({
    data: {
      userId: googleUser.id,
      tokenHash: hashToken(googleToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  try {
    await resetPasswordWithToken(prisma, googleToken, newPassword);
    throw new Error("google-only reset should have failed");
  } catch (error) {
    assert(String(error).includes("Google"), "google-only accounts cannot set a password");
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: { in: [user.id, googleUser.id] } } });
  await prisma.customerProfile.deleteMany({ where: { userId: { in: [user.id, googleUser.id] } } }).catch(() => null);
  await prisma.user.deleteMany({ where: { id: { in: [user.id, googleUser.id] } } });
  await prisma.$disconnect();
  console.log("password reset token hash, expiry, reuse and google-only checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
