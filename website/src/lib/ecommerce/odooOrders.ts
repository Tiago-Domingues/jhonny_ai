import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { OdooClient, hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { localStockAfterSale, odooQtyByProductId, stockFieldsFromQty } from "@/lib/ecommerce/odooStock";
import { fetchOdooInvoicePdf, odooPartnerCountryCode, odooPartnerValues } from "@/lib/ecommerce/odooInvoice";
import { registerPaidPosOrder } from "@/lib/ecommerce/odooPos";

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true, user: { include: { profile: true } } },
  });
}

async function findOrCreatePartner(client: OdooClient, order: NonNullable<Awaited<ReturnType<typeof loadOrder>>>) {
  const payload: Record<string, string | number> = { ...odooPartnerValues(order) };
  const countryCode = odooPartnerCountryCode(order);
  const countries = await client.searchRead("res.country", [["code", "=", countryCode]], ["id"], { limit: 1 });
  const countryId = Number(countries[0]?.id);
  if (Number.isFinite(countryId) && countryId > 0) payload.country_id = countryId;
  const existingPartnerId = order.user?.profile?.odooPartnerId;
  if (existingPartnerId) {
    await client.executeKw("res.partner", "write", [[existingPartnerId], payload]);
    return existingPartnerId;
  }

  const matches = await client.searchRead(
    "res.partner",
    [["email", "=", order.customerEmail]],
    ["id", "name", "email"],
    { limit: 1 }
  );
  const partnerId = matches[0]?.id
    ? Number(matches[0].id)
    : Number(await client.executeKw("res.partner", "create", [payload]));
  if (matches[0]?.id) {
    await client.executeKw("res.partner", "write", [[partnerId], payload]);
  }

  if (order.user?.profile) {
    await prisma.customerProfile.update({
      where: { id: order.user.profile.id },
      data: { odooPartnerId: partnerId, odooSyncStatus: "SYNCED", odooSyncError: null },
    });
  }

  return partnerId;
}

async function refreshLocalStockFromOdoo(
  client: OdooClient,
  items: Array<{ odooProductId: number | null; productId: string | null }>
) {
  const odooIds = [...new Set(items.map((item) => Number(item.odooProductId)).filter((id) => Number.isFinite(id) && id > 0))];
  if (!odooIds.length) return false;

  const rows = await client.searchRead("product.product", [["id", "in", odooIds]], ["id", "qty_available", "sale_ok"], {
    limit: odooIds.length,
  });
  const qtyById = odooQtyByProductId(rows);
  const saleableById = new Map<number, boolean>();
  for (const row of rows) {
    saleableById.set(Number(row.id), row.sale_ok !== false);
  }

  for (const item of items) {
    const odooId = Number(item.odooProductId);
    if (!qtyById.has(odooId)) continue;
    const fields = stockFieldsFromQty(qtyById.get(odooId) || 0, saleableById.get(odooId) ?? true);
    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: fields,
      });
    } else {
      await prisma.product.updateMany({
        where: { odooProductId: odooId },
        data: fields,
      });
    }
  }
  return true;
}

export async function decrementLocalStockForPaidOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return 0;

  let updated = 0;
  for (const item of order.items) {
    if (!item.productId) continue;
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) continue;
    const fields = localStockAfterSale(product.stockQuantity, item.quantity, product.saleable);
    await prisma.product.update({
      where: { id: product.id },
      data: fields,
    });
    updated += 1;
  }
  return updated;
}

export async function finalizeOdooOrderAfterPayment(orderId: string) {
  if (!hasOdooConfig()) {
    return { configured: false, skipped: true, stockRefreshed: false };
  }

  const order = await loadOrder(orderId);
  if (!order) throw new Error("Order not found.");
  if (order.odooSyncStatus === "SYNCED" && order.odooPosOrderId && order.odooInvoiceId) {
    return {
      configured: true,
      skipped: true,
      posOrderId: order.odooPosOrderId,
      invoiceId: order.odooInvoiceId,
      stockRefreshed: false,
    };
  }

  const client = new OdooClient();
  try {
    const partnerId = await findOrCreatePartner(client, order);
    let couponMeta: { label: string; percentOff: number } | null = null;
    if (order.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: order.couponCode },
        select: { label: true, percentOff: true },
      });
      if (coupon) couponMeta = coupon;
    }
    const pos = await registerPaidPosOrder(client, {
      orderNumber: order.orderNumber,
      partnerId,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      discountCents: order.discountCents,
      totalCents: order.totalCents,
      taxCents: order.taxCents,
      couponCode: order.couponCode,
      couponLabel: couponMeta?.label,
      couponPercentOff: couponMeta?.percentOff,
      notes: order.notes,
      items: order.items,
    });
    const stockRefreshed = await refreshLocalStockFromOdoo(client, order.items);
    try {
      await fetchOdooInvoicePdf(client, pos.invoiceId);
    } catch {
      // Email retry can generate the official PDF if this first pass fails.
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: order.paidAt || new Date(),
        odooPosOrderId: pos.posOrderId,
        odooInvoiceId: pos.invoiceId,
        odooSyncStatus: "SYNCED",
        odooSyncError: null,
      },
    });

    return {
      configured: true,
      skipped: false,
      posOrderId: pos.posOrderId,
      invoiceId: pos.invoiceId,
      stockRefreshed,
    };
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        odooSyncStatus: "SYNC_FAILED",
        odooSyncError: error instanceof Error ? error.message : "Unknown Odoo sync error",
      },
    });
    throw error;
  }
}

export async function syncPaidOrdersMissingOdooInvoices(limit = 20) {
  if (!hasOdooConfig()) {
    return { configured: false, attempted: 0, synced: 0, invoiced: [] as Array<{ orderId: string; orderNumber: string }>, errors: [] as Array<{ orderNumber: string; error: string }> };
  }

  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      OR: [{ odooInvoiceId: null }, { odooSyncStatus: { not: "SYNCED" } }],
    },
    orderBy: { paidAt: "desc" },
    take: limit,
    select: { id: true, orderNumber: true, odooInvoiceId: true },
  });

  const invoiced: Array<{ orderId: string; orderNumber: string }> = [];
  const errors: Array<{ orderNumber: string; error: string }> = [];
  let synced = 0;

  for (const order of orders) {
    try {
      const hadInvoice = Boolean(order.odooInvoiceId);
      const result = await finalizeOdooOrderAfterPayment(order.id);
      synced += 1;
      if (result.invoiceId && !hadInvoice) invoiced.push({ orderId: order.id, orderNumber: order.orderNumber });
    } catch (error) {
      errors.push({
        orderNumber: order.orderNumber,
        error: error instanceof Error ? error.message : "odoo_invoice_failed",
      });
    }
  }

  return { configured: true, attempted: orders.length, synced, invoiced, errors };
}
