import "server-only";

import { prisma } from "@/lib/ecommerce/db";

type CouponIdentity = {
  userId?: string | null;
  email?: string | null;
};

export function couponCodeFromName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

export function normalizeCouponCode(code?: string | null) {
  return (code || "").trim().toUpperCase().replace(/\s+/g, "");
}

export async function validateCoupon(code: string | undefined | null, subtotalCents: number, identity: CouponIdentity = {}) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return null;
  if (subtotalCents <= 0) throw new Error("Coupon requires a non-empty cart.");

  const now = new Date();
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
    include: { usages: true },
  });
  if (!coupon || !coupon.active) throw new Error("Coupon not found or inactive.");
  if (coupon.startsAt && coupon.startsAt > now) throw new Error("Coupon is not active yet.");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new Error("Coupon has expired.");
  if (coupon.maxUses && coupon.usages.length >= coupon.maxUses) throw new Error("Coupon usage limit reached.");

  if (coupon.maxUsesPerCustomer) {
    const customerUsages = coupon.usages.filter((usage) => {
      if (identity.userId && usage.userId === identity.userId) return true;
      if (identity.email && usage.guestEmail?.toLowerCase() === identity.email.toLowerCase()) return true;
      return false;
    });
    if (customerUsages.length >= coupon.maxUsesPerCustomer) {
      throw new Error("Coupon already used for this customer.");
    }
  }

  const discountCents = Math.max(0, Math.min(subtotalCents, Math.floor((subtotalCents * coupon.percentOff) / 100)));
  return {
    id: coupon.id,
    code: coupon.code,
    label: coupon.label,
    percentOff: coupon.percentOff,
    discountCents,
  };
}
