import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { normalizeEmail } from "@/lib/ecommerce/security";

export function normalizeOrderNumber(orderNumber: string) {
  return orderNumber.trim().toUpperCase();
}

const orderInclude = {
  items: true,
  payments: { orderBy: { createdAt: "desc" as const }, take: 1 },
};

export function serializeOrderPublic(order: {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  customerPhoneCountryCode: string;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  couponCode: string | null;
  notes: string | null;
  createdAt: Date;
  paidAt: Date | null;
  shippingAddressJson: unknown;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
    sku: string | null;
  }>;
  payments: Array<{
    id: string;
    method: string;
    status: string;
    amountCents: number;
    multibancoEntity: string | null;
    multibancoReference: string | null;
    paidAt: Date | null;
  }>;
}) {
  const payment = order.payments[0] || null;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    customerPhone: order.customerPhone
      ? `${order.customerPhoneCountryCode} ${order.customerPhone}`
      : null,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    currency: order.currency,
    couponCode: order.couponCode,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() || null,
    shippingAddress: order.shippingAddressJson || null,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.totalCents,
      sku: item.sku,
    })),
    payment: payment
      ? {
          method: payment.method,
          status: payment.status,
          amountCents: payment.amountCents,
          multibancoEntity: payment.multibancoEntity,
          multibancoReference: payment.multibancoReference,
          paidAt: payment.paidAt?.toISOString() || null,
        }
      : null,
  };
}

export async function listOrdersForAdmin(input: {
  q?: string;
  status?: string;
  limit?: number;
} = {}) {
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 200);
  const q = input.q?.trim();
  const where = {
    ...(input.status && input.status !== "all" ? { status: input.status as never } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" as const } },
            { customerEmail: { contains: q, mode: "insensitive" as const } },
            { customerName: { contains: q, mode: "insensitive" as const } },
            { customerPhone: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, orders, openCount, paidCount] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.order.count({
      where: {
        status: { in: ["PENDING_PAYMENT", "PAID", "PREPARING", "READY_FOR_PICKUP", "SHIPPED"] },
      },
    }),
    prisma.order.count({ where: { status: "PAID" } }),
  ]);

  return {
    total,
    stats: { openCount, paidCount, totalOrders: await prisma.order.count() },
    orders: orders.map(serializeOrderPublic),
  };
}

export async function listOrdersForUser(userId: string, email: string) {
  const normalized = normalizeEmail(email);
  const orders = await prisma.order.findMany({
    where: {
      OR: [{ userId }, { customerEmail: { equals: normalized, mode: "insensitive" } }],
    },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return orders.map(serializeOrderPublic);
}
