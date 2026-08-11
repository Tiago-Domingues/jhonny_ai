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

async function countPaidUsages(couponId: string, identity: CouponIdentity = {}) {
  return prisma.couponUsage.count({
    where: {
      couponId,
      order: { status: "PAID" },
      ...(identity.userId || identity.email
        ? {
            OR: [
              identity.userId ? { userId: identity.userId } : undefined,
              identity.email
                ? { guestEmail: { equals: identity.email, mode: "insensitive" as const } }
                : undefined,
            ].filter(Boolean) as object[],
          }
        : {}),
    },
  });
}

/** Pending unpaid orders that hold a coupon code until pay or cancel/expiry. */
async function countPendingCouponHolds(code: string, identity: CouponIdentity = {}) {
  return prisma.order.count({
    where: {
      couponCode: code,
      status: "PENDING_PAYMENT",
      paidAt: null,
      ...(identity.userId || identity.email
        ? {
            OR: [
              identity.userId ? { userId: identity.userId } : undefined,
              identity.email
                ? { customerEmail: { equals: identity.email, mode: "insensitive" as const } }
                : undefined,
            ].filter(Boolean) as object[],
          }
        : {}),
    },
  });
}

export async function validateCoupon(
  code: string | undefined | null,
  subtotalCents: number,
  identity: CouponIdentity = {}
) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return null;
  if (subtotalCents <= 0) throw new Error("Coupon requires a non-empty cart.");

  const now = new Date();
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });
  if (!coupon || !coupon.active) throw new Error("Coupon not found or inactive.");
  if (coupon.startsAt && coupon.startsAt > now) throw new Error("Coupon is not active yet.");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new Error("Coupon has expired.");

  const paidUses = await countPaidUsages(coupon.id);
  const pendingHolds = await countPendingCouponHolds(coupon.code);
  if (coupon.maxUses && paidUses + pendingHolds >= coupon.maxUses) {
    throw new Error("Coupon usage limit reached.");
  }

  if (coupon.maxUsesPerCustomer && (identity.userId || identity.email)) {
    const paidCustomer = await countPaidUsages(coupon.id, identity);
    const pendingCustomer = await countPendingCouponHolds(coupon.code, identity);
    if (paidCustomer + pendingCustomer >= coupon.maxUsesPerCustomer) {
      throw new Error("Coupon already used for this customer.");
    }
  }

  const discountCents = Math.max(
    0,
    Math.min(subtotalCents, Math.floor((subtotalCents * coupon.percentOff) / 100))
  );
  return {
    id: coupon.id,
    code: coupon.code,
    label: coupon.label,
    percentOff: coupon.percentOff,
    discountCents,
  };
}

/** Record coupon burn only after payment succeeds. Idempotent per order. */
export async function recordCouponUsageForPaidOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { couponUsage: true },
  });
  if (!order?.couponCode || order.discountCents <= 0) return null;
  if (order.couponUsage) return order.couponUsage;

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizeCouponCode(order.couponCode) },
  });
  if (!coupon) return null;

  return prisma.couponUsage.create({
    data: {
      couponId: coupon.id,
      orderId: order.id,
      userId: order.userId || null,
      guestEmail: order.userId ? null : order.customerEmail,
      code: coupon.code,
      discountCents: order.discountCents,
      subtotalCents: order.subtotalCents,
    },
  });
}
