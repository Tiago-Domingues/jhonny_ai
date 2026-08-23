import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/ecommerce/db";
import { isAdminEmail } from "@/lib/ecommerce/admin";
import { pendingRegisterSchema } from "@/lib/ecommerce/schemas";
import { hashPassword, hashToken, normalizeEmail, randomToken } from "@/lib/ecommerce/security";
import { sendEmailVerificationEmail } from "@/lib/ecommerce/email";
import { publicSiteOrigin } from "@/lib/ecommerce/stripeCheckout";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export function isVerifyTokenFormat(token: string) {
  return typeof token === "string" && token.length >= 20 && token.length <= 200;
}

function verifyUrl(token: string) {
  return `${publicSiteOrigin()}/conta/verificar-email?token=${encodeURIComponent(token)}`;
}

export async function startPendingRegistration(input: unknown) {
  const data = pendingRegisterSchema.parse(input);
  const email = normalizeEmail(data.email);
  const username = data.username.trim();

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true },
  });
  if (existingUser) {
    throw new Error("Email or username is already registered.");
  }

  const usernameHeld = await prisma.pendingRegistration.findFirst({
    where: { username, NOT: { email } },
    select: { id: true },
  });
  if (usernameHeld) {
    throw new Error("Email or username is already registered.");
  }

  const token = randomToken(32);
  const passwordHash = await hashPassword(data.password);
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS);

  await prisma.pendingRegistration.upsert({
    where: { email },
    create: {
      email,
      username,
      passwordHash,
      tokenHash: hashToken(token),
      expiresAt,
    },
    update: {
      username,
      passwordHash,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  await sendEmailVerificationEmail({
    email,
    fullName: username,
    verifyUrl: verifyUrl(token),
  }).catch(() => null);

  return { pending: true as const };
}

export async function remindPendingRegistration(email: string) {
  const pending = await prisma.pendingRegistration.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!pending) return false;
  const token = randomToken(32);
  await prisma.pendingRegistration.update({
    where: { id: pending.id },
    data: {
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });
  await sendEmailVerificationEmail({
    email: pending.email,
    fullName: pending.username,
    verifyUrl: verifyUrl(token),
  }).catch(() => null);
  return true;
}

export async function requestEmailVerification(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) return { accepted: true };
  if (user.emailVerifiedAt) return { accepted: true, alreadyVerified: true };

  const token = randomToken(32);
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });
  await sendEmailVerificationEmail({
    userId: user.id,
    email: user.email,
    fullName: user.profile?.fullName,
    verifyUrl: verifyUrl(token),
  }).catch(() => null);
  return { accepted: true };
}

export async function verifyEmailWithToken(token: string) {
  const tokenHash = hashToken(token);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { profile: true } } },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    throw new Error("This verification link is invalid or has expired.");
  }
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: row.user.emailVerifiedAt || new Date() },
      include: { profile: true },
    }),
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return { user, created: false };
}

export async function completeRegistrationWithToken(token: string) {
  const tokenHash = hashToken(token);
  const pending = await prisma.pendingRegistration.findUnique({
    where: { tokenHash },
  });

  if (pending) {
    if (pending.expiresAt.getTime() < Date.now()) {
      throw new Error("This verification link is invalid or has expired.");
    }
    try {
      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: pending.email,
            username: pending.username,
            passwordHash: pending.passwordHash,
            emailVerifiedAt: new Date(),
            role: isAdminEmail(pending.email) ? "ADMIN" : "CUSTOMER",
            profile: {
              create: {
                fullName: pending.username,
              },
            },
          },
          include: { profile: true },
        });
        await tx.pendingRegistration.delete({ where: { id: pending.id } });
        return created;
      });
      return { user, created: true as const };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("Email or username is already registered.");
      }
      throw error;
    }
  }

  return { ...(await verifyEmailWithToken(token)), created: false as const };
}
