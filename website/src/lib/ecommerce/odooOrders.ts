import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { OdooClient, hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { centsToEuros } from "@/lib/ecommerce/money";
import {
  localStockAfterSale,
  odooQtyByProductId,
  stockFieldsFromQty,
  validateOpenPickings,
  type OdooRpcClient,
} from "@/lib/ecommerce/odooStock";

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function idArray(value: unknown) {
  return asArray(value as number | number[] | null | undefined)
    .map(Number)
    .filter((id) => Number.isFinite(id) && id > 0);
}

function partnerPayload(order: Awaited<ReturnType<typeof loadOrder>>) {
  if (!order) throw new Error("Order not found.");
  const address =
    typeof order.shippingAddressJson === "object" && order.shippingAddressJson
      ? (order.shippingAddressJson as Record<string, string>)
      : {};
  return {
    name: order.customerName,
    email: order.customerEmail,
    phone: order.customerPhone || "",
    street: address.addressLine1 || "",
    street2: address.addressLine2 || "",
    zip: address.postalCode || "",
    city: address.city || "",
    customer_rank: 1,
  };
}

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true, user: { include: { profile: true } } },
  });
}

async function findOrCreatePartner(client: OdooClient, order: NonNullable<Awaited<ReturnType<typeof loadOrder>>>) {
  const existingPartnerId = order.user?.profile?.odooPartnerId;
  if (existingPartnerId) return existingPartnerId;

  const matches = await client.searchRead(
    "res.partner",
    [["email", "=", order.customerEmail]],
    ["id", "name", "email"],
    { limit: 1 }
  );
  const partnerId = matches[0]?.id
    ? Number(matches[0].id)
    : Number(await client.executeKw("res.partner", "create", [partnerPayload(order)]));

  if (order.user?.profile) {
    await prisma.customerProfile.update({
      where: { id: order.user.profile.id },
      data: { odooPartnerId: partnerId, odooSyncStatus: "SYNCED", odooSyncError: null },
    });
  }

  return partnerId;
}

async function createSaleOrder(client: OdooClient, order: NonNullable<Awaited<ReturnType<typeof loadOrder>>>, partnerId: number) {
  const lines = order.items
    .filter((item) => item.odooProductId)
    .map((item) => [
      0,
      0,
      {
        product_id: item.odooProductId!,
        product_uom_qty: item.quantity,
        price_unit: centsToEuros(item.unitPriceCents),
        name: item.name,
      },
    ]);

  if (!lines.length || lines.length !== order.items.length) {
    throw new Error("All order items must have Odoo product IDs before syncing to Odoo.");
  }

  return Number(
    await client.executeKw("sale.order", "create", [
      {
        partner_id: partnerId,
        origin: order.orderNumber,
        client_order_ref: order.orderNumber,
        note: order.notes || "",
        order_line: lines,
      },
    ])
  );
}

async function confirmSaleOrder(client: OdooClient, saleOrderId: number) {
  if (process.env.ODOO_AUTO_CONFIRM_SALE_ORDER !== "true") return;
  await client.executeKw("sale.order", "action_confirm", [[saleOrderId]]);
}

async function createAndPostInvoice(client: OdooClient, saleOrderId: number) {
  if (process.env.ODOO_CREATE_INVOICE_AFTER_PAYMENT !== "true") return null;
  const invoiceResult = await client.executeKw("sale.order", "_create_invoices", [[saleOrderId]]);
  const invoiceIds = idArray(invoiceResult);
  if (!invoiceIds.length) return null;

  await client.executeKw("account.move", "action_post", [invoiceIds]);
  return invoiceIds[0];
}

async function maybeValidateDelivery(client: OdooClient, saleOrderId: number) {
  return validateOpenPickings(client as unknown as OdooRpcClient, saleOrderId);
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
  if (order.odooSyncStatus === "SYNCED" && order.odooSaleOrderId) {
    return {
      configured: true,
      skipped: true,
      saleOrderId: order.odooSaleOrderId,
      invoiceId: order.odooInvoiceId,
      stockRefreshed: false,
    };
  }

  const client = new OdooClient();
  try {
    const partnerId = await findOrCreatePartner(client, order);
    const saleOrderId = order.odooSaleOrderId || (await createSaleOrder(client, order, partnerId));
    if (!order.odooSaleOrderId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { odooSaleOrderId: saleOrderId },
      });
    }
    await confirmSaleOrder(client, saleOrderId);
    const invoiceId = order.odooInvoiceId || (await createAndPostInvoice(client, saleOrderId));
    const delivery = await maybeValidateDelivery(client, saleOrderId);
    const stockRefreshed = delivery.skipped ? false : await refreshLocalStockFromOdoo(client, order.items);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: order.paidAt || new Date(),
        odooSaleOrderId: saleOrderId,
        odooInvoiceId: invoiceId || undefined,
        odooSyncStatus: "SYNCED",
        odooSyncError: null,
      },
    });

    return { configured: true, skipped: false, saleOrderId, invoiceId, stockRefreshed };
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
