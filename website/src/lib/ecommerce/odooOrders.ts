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
import {
  accountMovePaymentContext,
  isFaturaReciboJournal,
  odooPartnerCountryCode,
  odooPartnerValues,
  runSaleInvoiceWizard,
} from "@/lib/ecommerce/odooInvoice";

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function idArray(value: unknown) {
  return asArray(value as number | number[] | null | undefined)
    .map(Number)
    .filter((id) => Number.isFinite(id) && id > 0);
}

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

async function findExistingSaleOrder(client: OdooClient, orderNumber: string) {
  const matches = await client.searchRead(
    "sale.order",
    ["|", ["client_order_ref", "=", orderNumber], ["origin", "=", orderNumber]],
    ["id"],
    { limit: 1 }
  );
  return Number(matches[0]?.id) || 0;
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
        partner_invoice_id: partnerId,
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
  const orders = await client.searchRead("sale.order", [["id", "=", saleOrderId]], ["state"], { limit: 1 });
  const state = String(orders[0]?.state || "");
  if (state === "sale" || state === "done") return;
  await client.executeKw("sale.order", "action_confirm", [[saleOrderId]]);
}

async function invoicesForSaleOrder(client: OdooClient, saleOrderId: number) {
  const orders = await client.searchRead("sale.order", [["id", "=", saleOrderId]], ["invoice_ids"], { limit: 1 });
  const fromOrder = idArray(orders[0]?.invoice_ids);
  if (fromOrder.length) return fromOrder;
  const moves = await client.searchRead(
    "account.move",
    [
      ["move_type", "=", "out_invoice"],
      ["invoice_line_ids.sale_line_ids.order_id", "=", saleOrderId],
    ],
    ["id"],
    { limit: 10, order: "id desc" }
  );
  return idArray(moves.map((move) => move.id));
}

async function faturaReciboJournalId(client: OdooClient) {
  const journals = await client.searchRead(
    "account.journal",
    [["type", "=", "sale"]],
    ["id", "name", "code"],
    { limit: 50 }
  );
  const match = journals.find((journal) => isFaturaReciboJournal(journal));
  return Number(match?.id) || 0;
}

async function createInvoicesViaPublicWizard(client: OdooClient, saleOrderId: number) {
  const fromAction = await runSaleInvoiceWizard(client, saleOrderId);
  if (fromAction.length) return fromAction;
  return invoicesForSaleOrder(client, saleOrderId);
}

async function markSaleLinesDeliveredForInvoice(client: OdooClient, saleOrderId: number) {
  const lines = await client.searchRead(
    "sale.order.line",
    [
      ["order_id", "=", saleOrderId],
      ["display_type", "=", false],
    ],
    ["id", "product_uom_qty", "qty_to_invoice"],
    { limit: 100 }
  );
  for (const line of lines) {
    const ordered = Number(line.product_uom_qty || 0);
    const toInvoice = Number(line.qty_to_invoice || 0);
    if (!(ordered > 0) || toInvoice > 0) continue;
    try {
      await client.executeKw("sale.order.line", "write", [[Number(line.id)], { qty_delivered: ordered }]);
    } catch {
      // qty_delivered is computed from stock moves on some products.
    }
  }
}

async function postInvoice(client: OdooClient, invoiceId: number) {
  const moves = await client.searchRead("account.move", [["id", "=", invoiceId]], ["id", "state"], { limit: 1 });
  if (String(moves[0]?.state || "") === "draft") {
    await client.executeKw("account.move", "action_post", [[invoiceId]]);
  }
}

async function registerInvoicePayment(client: OdooClient, invoiceId: number) {
  const moves = await client.searchRead(
    "account.move",
    [["id", "=", invoiceId]],
    ["id", "state", "payment_state", "amount_residual"],
    { limit: 1 }
  );
  const move = moves[0];
  if (!move) return;
  const paymentState = String(move.payment_state || "");
  if (paymentState === "paid" || paymentState === "in_payment" || Number(move.amount_residual || 0) <= 0) return;

  const context = accountMovePaymentContext(invoiceId);
  const wizardId = Number(
    await client.executeKw("account.payment.register", "create", [{}], { context })
  );
  if (!Number.isFinite(wizardId) || wizardId <= 0) return;
  await client.executeKw("account.payment.register", "action_create_payments", [[wizardId]], { context });
}

async function createAndPostInvoice(client: OdooClient, saleOrderId: number) {
  if (process.env.ODOO_CREATE_INVOICE_AFTER_PAYMENT !== "true") return null;

  let invoiceIds = await invoicesForSaleOrder(client, saleOrderId);
  if (!invoiceIds.length) {
    invoiceIds = await createInvoicesViaPublicWizard(client, saleOrderId);
  }
  if (!invoiceIds.length) {
    await markSaleLinesDeliveredForInvoice(client, saleOrderId);
    invoiceIds = await createInvoicesViaPublicWizard(client, saleOrderId);
  }
  if (!invoiceIds.length) {
    throw new Error("Odoo did not create a customer invoice (fatura-recibo) for this paid order.");
  }
  const invoiceId = invoiceIds[0];

  const journalId = await faturaReciboJournalId(client);
  if (journalId) {
    const moves = await client.searchRead("account.move", [["id", "=", invoiceId]], ["state"], { limit: 1 });
    if (String(moves[0]?.state || "") === "draft") {
      try {
        await client.executeKw("account.move", "write", [[invoiceId], { journal_id: journalId }]);
      } catch {
        // Keep the default sales journal if Fatura-Recibo is not writable.
      }
    }
  }

  await postInvoice(client, invoiceId);
  try {
    await registerInvoicePayment(client, invoiceId);
  } catch {
    // Posted invoice is still a legal document if payment registration needs a journal setup.
  }
  return invoiceId;
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
  if (order.odooSyncStatus === "SYNCED" && order.odooSaleOrderId && order.odooInvoiceId) {
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
    const saleOrderId =
      order.odooSaleOrderId ||
      (await findExistingSaleOrder(client, order.orderNumber)) ||
      (await createSaleOrder(client, order, partnerId));
    if (!order.odooSaleOrderId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { odooSaleOrderId: saleOrderId },
      });
    }
    await confirmSaleOrder(client, saleOrderId);
    const delivery = await maybeValidateDelivery(client, saleOrderId);
    const invoiceId = order.odooInvoiceId || (await createAndPostInvoice(client, saleOrderId));
    if (process.env.ODOO_CREATE_INVOICE_AFTER_PAYMENT === "true" && !invoiceId) {
      throw new Error("Odoo did not create a customer invoice (fatura-recibo) for this paid order.");
    }
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
