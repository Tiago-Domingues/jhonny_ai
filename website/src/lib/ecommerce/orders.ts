import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { normalizeEmail } from "@/lib/ecommerce/security";

export function normalizeOrderNumber(orderNumber: string) {
  return orderNumber.trim().toUpperCase();
}

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
      ? `${order.customerPhoneCountryCode}${order.customerPhone}`
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

const orderInclude = {
  items: true,
  payments: { orderBy: { createdAt: "desc" as const }, take: 1 },
};

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

export async function lookupOrderByEmailAndNumber(email: string, orderNumber: string) {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: normalizeOrderNumber(orderNumber),
      customerEmail: { equals: normalizeEmail(email), mode: "insensitive" },
    },
    include: orderInclude,
  });
  return order ? serializeOrderPublic(order) : null;
}

export async function listOrdersForAdmin(limit = 100) {
  const orders = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return orders.map(serializeOrderPublic);
}
