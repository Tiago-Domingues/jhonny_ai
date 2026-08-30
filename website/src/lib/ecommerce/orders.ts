import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { ordersWhereForUser } from "@/lib/ecommerce/orderAccess";
import { PAID_PLUS_STATUSES } from "@/lib/ecommerce/orderKpis";

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
  odooInvoiceId?: number | null;
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
    hasFaturaRecibo: Boolean(order.odooInvoiceId),
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

  const [total, orders, openCount, paidCount, kpis] = await Promise.all([
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
    getAdminOrderKpis(),
  ]);

  return {
    total,
    stats: { openCount, paidCount, totalOrders: await prisma.order.count(), ...kpis },
    orders: orders.map(serializeOrderPublic),
  };
}

export async function getAdminOrderKpis() {
  const paidWhere = { status: { in: [...PAID_PLUS_STATUSES] } };
  const [paid, addressCount, pickupCount, totals] = await Promise.all([
    prisma.order.findMany({
      where: paidWhere,
      select: { totalCents: true, fulfillmentMethod: true },
    }),
    prisma.order.count({ where: { ...paidWhere, fulfillmentMethod: "SHIP_TO_ADDRESS" } }),
    prisma.order.count({ where: { ...paidWhere, fulfillmentMethod: "PICKUP_IN_STORE" } }),
    prisma.order.aggregate({ where: paidWhere, _sum: { totalCents: true }, _count: true }),
  ]);
  const revenueCents = totals._sum.totalCents || 0;
  const paidCount = totals._count || paid.length;
  return {
    revenueCents,
    averagePurchaseCents: paidCount ? Math.round(revenueCents / paidCount) : 0,
    addressCount,
    pickupCount,
    paidPlusCount: paidCount,
  };
}

export async function listAllOrdersForAdminExport() {
  const orders = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return orders.map((order) => ({
    ...serializeOrderPublic(order),
    itemCount: order.items.length,
  }));
}

export async function listOrdersForCustomerAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) return null;
  return listOrdersForUser(user.id, user.email);
}

export async function listOrdersForUser(userId: string, email: string) {
  const orders = await prisma.order.findMany({
    where: ordersWhereForUser(userId, email),
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return orders.map(serializeOrderPublic);
}
