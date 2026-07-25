import "server-only";

import { prisma } from "@/lib/ecommerce/db";

export type StockLine = {
  productId: string;
  quantity: number;
  name?: string;
};

function stockMeta(quantity: number) {
  const qty = Math.max(0, quantity);
  return {
    stockQuantity: qty,
    stockState: qty > 0 ? "in_stock" : "out_of_stock",
    availableForSale: qty > 0,
  };
}

/** Atomically decrement stock for checkout. Fails closed if any line races or lacks stock. */
export async function reserveStockForItems(items: StockLine[]) {
  if (items.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (!item.productId || item.quantity <= 0) continue;

      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stockQuantity: { gte: item.quantity },
        },
        data: {
          stockQuantity: { decrement: item.quantity },
        },
      });

      if (updated.count !== 1) {
        const label = item.name || "item";
        throw new Error(`Only limited stock remains for ${label}. Refresh and try again.`);
      }

      const product = await tx.product.findUniqueOrThrow({
        where: { id: item.productId },
        select: { stockQuantity: true },
      });
      await tx.product.update({
        where: { id: item.productId },
        data: stockMeta(product.stockQuantity),
      });
    }
  });
}

export async function releaseStockForItems(items: StockLine[]) {
  if (items.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (!item.productId || item.quantity <= 0) continue;
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stockQuantity: true },
      });
      if (!product) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: stockMeta(product.stockQuantity + item.quantity),
      });
    }
  });
}

export async function releaseStockForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return 0;

  const lines = order.items
    .filter((item) => item.productId)
    .map((item) => ({
      productId: item.productId as string,
      quantity: item.quantity,
      name: item.name,
    }));
  await releaseStockForItems(lines);
  return lines.length;
}

/**
 * Cancel an unpaid order: release reserved stock, drop pending coupon hold,
 * mark payment expired, set order CANCELLED. No-op if already paid/cancelled.
 */
export async function cancelUnpaidOrder(orderId: string, reason = "unpaid_expired") {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      couponUsage: true,
    },
  });
  if (!order) return { cancelled: false as const, reason: "not_found" };

  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    return { cancelled: false as const, reason: "already_closed" };
  }
  if (order.status === "PAID" || order.paidAt || order.payments.some((p) => p.status === "PAID")) {
    return { cancelled: false as const, reason: "already_paid" };
  }
  if (order.status !== "PENDING_PAYMENT" && order.status !== "DRAFT") {
    return { cancelled: false as const, reason: "not_unpaid" };
  }

  await releaseStockForOrder(orderId);

  if (order.couponUsage) {
    await prisma.couponUsage.delete({ where: { orderId: order.id } }).catch(() => undefined);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "CANCELLED",
      notes: order.notes
        ? `${order.notes}\n[cancelled:${reason}]`
        : `[cancelled:${reason}]`,
    },
  });

  const payment = order.payments[0];
  if (payment && payment.status !== "PAID") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "EXPIRED" },
    });
  }

  return { cancelled: true as const, reason };
}

export function unpaidOrderExpireHours() {
  const raw = Number(process.env.UNPAID_ORDER_EXPIRE_HOURS || "72");
  if (!Number.isFinite(raw) || raw <= 0) return 72;
  return Math.min(raw, 24 * 14);
}

export async function expireUnpaidOrders(limit = 100) {
  const hours = unpaidOrderExpireHours();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      paidAt: null,
      createdAt: { lt: cutoff },
    },
    select: { id: true, orderNumber: true },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let cancelled = 0;
  for (const order of orders) {
    const result = await cancelUnpaidOrder(order.id, `unpaid_expired_${hours}h`);
    if (result.cancelled) cancelled += 1;
  }
  return { scanned: orders.length, cancelled, expireHours: hours };
}
