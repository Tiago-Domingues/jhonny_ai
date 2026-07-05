import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { OdooClient, hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { centsToEuros } from "@/lib/ecommerce/money";

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
  if (process.env.ODOO_AUTO_VALIDATE_DELIVERY !== "true") return;
  const pickings = await client.searchRead(
    "stock.picking",
    [["sale_id", "=", saleOrderId]],
    ["id", "state"],
    { limit: 10 }
  );
  const pickingIds = pickings
    .filter((picking) => !["done", "cancel"].includes(String(picking.state)))
    .map((picking) => Number(picking.id));
  if (pickingIds.length) {
    await client.executeKw("stock.picking", "button_validate", [pickingIds]);
  }
}

export async function finalizeOdooOrderAfterPayment(orderId: string) {
  if (!hasOdooConfig()) {
    return { configured: false, skipped: true };
  }

  const order = await loadOrder(orderId);
  if (!order) throw new Error("Order not found.");
  if (order.odooSaleOrderId && order.odooInvoiceId) {
    return { configured: true, skipped: true, saleOrderId: order.odooSaleOrderId, invoiceId: order.odooInvoiceId };
  }

  const client = new OdooClient();
  try {
    const partnerId = await findOrCreatePartner(client, order);
    const saleOrderId = order.odooSaleOrderId || (await createSaleOrder(client, order, partnerId));
    await confirmSaleOrder(client, saleOrderId);
    const invoiceId = await createAndPostInvoice(client, saleOrderId);
    await maybeValidateDelivery(client, saleOrderId);

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

    return { configured: true, saleOrderId, invoiceId };
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
