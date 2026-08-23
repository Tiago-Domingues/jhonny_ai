import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { hashPassword, hashToken, normalizeEmail, randomToken } from "@/lib/ecommerce/security";
import { sendPasswordResetEmail } from "@/lib/ecommerce/email";
import { publicSiteOrigin } from "@/lib/ecommerce/stripeCheckout";

const RESET_TTL_MS = 60 * 60 * 1000;

export async function requestPasswordReset(emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });
  if (!user) return { accepted: true };

  const origin = publicSiteOrigin();
  if (!user.passwordHash) {
    await sendPasswordResetEmail({
      userId: user.id,
      email: user.email,
      fullName: user.profile?.fullName,
      resetUrl: `${origin}/conta`,
      googleOnly: true,
    }).catch(() => null);
    return { accepted: true };
  }

  const token = randomToken(32);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });
  await sendPasswordResetEmail({
    userId: user.id,
    email: user.email,
    fullName: user.profile?.fullName,
    resetUrl: `${origin}/conta/redefinir-password?token=${encodeURIComponent(token)}`,
  }).catch(() => null);
  return { accepted: true };
}

export async function resetPasswordWithToken(token: string, password: string) {
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
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return { ok: true };
}

export function isResetTokenFormat(token: string) {
  return typeof token === "string" && token.length >= 20 && token.length <= 200;
}
