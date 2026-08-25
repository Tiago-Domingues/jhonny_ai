import "server-only";

import { prisma } from "@/lib/ecommerce/db";

type CouponIdentity = {
  userId?: string | null;
  email?: string | null;
};

const WELCOME_COUPON_CODES = new Set(["JHONNY10"]);

const CONSUMED_ORDER_STATUSES = [
  "PAID",
  "PREPARING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
] as const;

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

export function isWelcomeCoupon(code?: string | null) {
  return WELCOME_COUPON_CODES.has(normalizeCouponCode(code));
}

function usageWasConsumed(usage: { order?: { status: string } | null }) {
  return CONSUMED_ORDER_STATUSES.includes(
    (usage.order?.status || "") as (typeof CONSUMED_ORDER_STATUSES)[number]
  );
}

export async function validateCoupon(code: string | undefined | null, subtotalCents: number, identity: CouponIdentity = {}) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return null;
  if (subtotalCents <= 0) throw new Error("Coupon requires a non-empty cart.");

  const now = new Date();
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
    include: {
      usages: { include: { order: { select: { status: true } } } },
      wheelSpin: { select: { userId: true } },
    },
  });
  if (!coupon || !coupon.active) throw new Error("Coupon not found or inactive.");
  if (coupon.startsAt && coupon.startsAt > now) throw new Error("Coupon is not active yet.");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new Error("Coupon has expired.");

  // Prize-wheel codes belong to the account that won them. Without this, a
  // customer could publish their 20% code and anyone could redeem it.
  if (coupon.wheelSpin) {
    if (!identity.userId) {
      throw new Error("Sign in with the account that won this prize to use it.");
    }
    if (coupon.wheelSpin.userId !== identity.userId) {
      throw new Error("This prize coupon belongs to another account.");
    }
  }

  const consumedUsages = coupon.usages.filter(usageWasConsumed);
  if (coupon.maxUses && consumedUsages.length >= coupon.maxUses) {
    throw new Error("Coupon usage limit reached.");
  }

  if (isWelcomeCoupon(coupon.code)) {
    if (!identity.userId) {
      throw new Error("Sign in to use the welcome coupon on your first purchase.");
    }
    const paidOrders = await prisma.order.count({
      where: {
        userId: identity.userId,
        status: { in: [...CONSUMED_ORDER_STATUSES] },
      },
    });
    if (paidOrders > 0) {
      throw new Error("The welcome coupon is only valid on your first paid order.");
    }
  }

  if (coupon.maxUsesPerCustomer) {
    const customerUsages = consumedUsages.filter((usage) => {
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

/** Persist coupon redemption only after the order is actually paid. */
export async function recordCouponUsageForPaidOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { couponUsage: true },
  });
  if (!order?.couponCode) return;
  if (order.couponUsage) return;

  const coupon = await prisma.coupon.findUnique({
    where: { code: order.couponCode },
  });
  if (!coupon) return;

  await prisma.couponUsage.create({
    data: {
      couponId: coupon.id,
      orderId: order.id,
      userId: order.userId,
      guestEmail: order.userId ? null : order.customerEmail,
      code: coupon.code,
      discountCents: order.discountCents,
      subtotalCents: order.subtotalCents,
    },
  });
}
