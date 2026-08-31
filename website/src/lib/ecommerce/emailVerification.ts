import "server-only";

import { Prisma, type PendingRegistration } from "@prisma/client";
import { prisma } from "@/lib/ecommerce/db";
import { isAdminEmail } from "@/lib/ecommerce/admin";
import { loginSchema } from "@/lib/ecommerce/schemas";
import { hashToken, randomToken, verifyPassword } from "@/lib/ecommerce/security";
import { sendEmailVerificationEmail } from "@/lib/ecommerce/email";
import { buildVerifyEmailUrl } from "@/lib/ecommerce/stripeCheckout";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export function isVerifyTokenFormat(token: string) {
  return typeof token === "string" && token.length >= 20 && token.length <= 200;
}

async function sendVerificationLink(input: {
  userId?: string | null;
  email: string;
  fullName?: string | null;
  verifyUrl: string;
}) {
  return sendEmailVerificationEmail(input);
}

async function createUserFromPending(pending: PendingRegistration) {
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
              marketingOptIn: pending.marketingOptIn,
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
      const existing = await prisma.user.findUnique({
        where: { email: pending.email },
        include: { profile: true },
      });
      if (existing) {
        await prisma.pendingRegistration.deleteMany({ where: { id: pending.id } });
        if (!existing.emailVerifiedAt) {
          const verified = await prisma.user.update({
            where: { id: existing.id },
            data: { emailVerifiedAt: new Date() },
            include: { profile: true },
          });
          return { user: verified, created: false as const };
        }
        return { user: existing, created: false as const };
      }
      throw new Error("Email or username is already registered.");
    }
    throw error;
  }
}

export async function completePendingRegistrationWithPassword(input: unknown) {
  const data = loginSchema.parse(input);
  const emailOrUsername = data.emailOrUsername.trim().toLowerCase();
  const pending = await prisma.pendingRegistration.findFirst({
    where: {
      OR: [{ email: emailOrUsername }, { username: data.emailOrUsername.trim() }],
    },
  });
  if (!pending || !(await verifyPassword(data.password, pending.passwordHash))) {
    return null;
  }
  return createUserFromPending(pending);
}

export async function requestEmailVerification(userId: string, origin?: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) return { accepted: true as const, status: "SKIPPED" as const };
  if (user.emailVerifiedAt) return { accepted: true as const, alreadyVerified: true as const, status: "SKIPPED" as const };

  const token = randomToken(32);
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });
  const event = await sendVerificationLink({
    userId: user.id,
    email: user.email,
    fullName: user.profile?.fullName,
    verifyUrl: buildVerifyEmailUrl(token, origin),
  });
  return { accepted: true as const, status: event.status };
}

export async function verifyEmailWithToken(token: string) {
  const tokenHash = hashToken(token);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { profile: true } } },
  });
  if (!row) {
    throw new Error("This verification link is invalid or has expired.");
  }
  if (row.usedAt) {
    return { user: row.user, created: false };
  }
  if (row.expiresAt.getTime() < Date.now()) {
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
                marketingOptIn: pending.marketingOptIn,
              },
            },
          },
          include: { profile: true },
        });
        await tx.emailVerificationToken.create({
          data: {
            userId: created.id,
            tokenHash,
            expiresAt: pending.expiresAt,
            usedAt: new Date(),
          },
        });
        await tx.pendingRegistration.delete({ where: { id: pending.id } });
        return created;
      });
      return { user, created: true as const };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await prisma.user.findUnique({
          where: { email: pending.email },
          include: { profile: true },
        });
        if (existing?.emailVerifiedAt) {
          return { user: existing, created: false as const };
        }
        throw new Error("Email or username is already registered.");
      }
      throw error;
    }
  }

  return { ...(await verifyEmailWithToken(token)), created: false as const };
}
