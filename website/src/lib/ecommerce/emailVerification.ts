import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { hashToken, randomToken } from "@/lib/ecommerce/security";
import { sendEmailVerificationEmail } from "@/lib/ecommerce/email";
import { publicSiteOrigin } from "@/lib/ecommerce/stripeCheckout";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export function isVerifyTokenFormat(token: string) {
  return typeof token === "string" && token.length >= 20 && token.length <= 200;
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
  const origin = publicSiteOrigin();
  await sendEmailVerificationEmail({
    userId: user.id,
    email: user.email,
    fullName: user.profile?.fullName,
    verifyUrl: `${origin}/conta/verificar-email?token=${encodeURIComponent(token)}`,
  }).catch(() => null);
  return { accepted: true };
}

export async function verifyEmailWithToken(token: string) {
  const tokenHash = hashToken(token);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    throw new Error("This verification link is invalid or has expired.");
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: row.user.emailVerifiedAt || new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return { ok: true };
}
