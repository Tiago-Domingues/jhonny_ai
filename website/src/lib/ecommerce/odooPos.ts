export type PosRpcClient = {
  executeKw: (...args: any[]) => Promise<unknown>;
  searchRead: (...args: any[]) => Promise<Record<string, unknown>[]>;
};

export function posConfigName(value = process.env.ODOO_POS_CONFIG_NAME) {
  return String(value || "Loja Carcavelos").trim() || "Loja Carcavelos";
}

export function asOdooId(value: unknown): number {
  if (Array.isArray(value)) return asOdooId(value[0]);
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

export function idList(value: unknown): number[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map(asOdooId).filter(Boolean);
  const id = asOdooId(value);
  return id ? [id] : [];
}

export function pickPosPaymentMethod(
  methods: Array<{ id?: unknown; name?: unknown; type?: unknown; is_cash_count?: unknown; journal_id?: unknown }>
) {
  if (!methods.length) return 0;
  const scored = methods.map((method) => {
    const name = String(method.name || "").toLowerCase();
    const type = String(method.type || "").toLowerCase();
    const journalId = asOdooId(method.journal_id);
    let score = 0;
    if (/stripe|mb ?way|multibanco|online|website|bank|cart|visa|mbway|cartão|cartao/.test(name)) score += 8;
    if (type === "bank" || type === "pay_later") score += 4;
    if (type === "cash" || method.is_cash_count) score -= 3;
    if (journalId) score += 10;
    if ((type === "bank" || type === "cash" || method.is_cash_count) && !journalId) score -= 12;
    return { id: asOdooId(method.id), score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id || 0;
}

export function posOrderSearchDomain(orderNumber: string, availableFields?: Iterable<string>) {
  const available = availableFields ? new Set(availableFields) : null;
  const clauses: Array<[string, string, string]> = [];
  if (!available || available.has("pos_reference")) clauses.push(["pos_reference", "=", orderNumber]);
  if (!available || available.has("name")) clauses.push(["name", "=", orderNumber]);
  if (!available || available.has("note")) clauses.push(["note", "ilike", orderNumber]);
  if (!clauses.length) clauses.push(["pos_reference", "=", orderNumber]);
  if (clauses.length === 1) return clauses;
  return [...Array(clauses.length - 1).fill("|"), ...clauses];
}

function many2oneName(value: unknown) {
  return Array.isArray(value) ? String(value[1] || "") : "";
}

export async function diagnosePos(client: PosRpcClient) {
  const configs = await client.searchRead(
    "pos.config",
    [],
    ["id", "name", "invoice_journal_id", "payment_method_ids", "company_id"],
    { limit: 20 }
  );
  const wanted = posConfigName().toLowerCase();
  const config =
    configs.find((row) => String(row.name || "").toLowerCase().includes(wanted)) || configs[0] || null;
  const configId = asOdooId(config?.id);
  const sessions = configId
    ? await client.searchRead(
        "pos.session",
        [["config_id", "=", configId]],
        ["id", "name", "state", "config_id", "start_at"],
        { limit: 8, order: "id desc" }
      )
    : [];
  const methodIds = idList(config?.payment_method_ids);
  const methods = methodIds.length
    ? await client.searchRead(
        "pos.payment.method",
        [["id", "in", methodIds]],
        ["id", "name", "type", "is_cash_count", "journal_id"],
        { limit: 30 }
      )
    : [];
  const recent = await client.searchRead(
    "pos.order",
    configId ? [["config_id", "=", configId]] : [],
    ["id", "name", "pos_reference", "state", "partner_id", "account_move", "amount_total", "to_invoice", "date_order"],
    { limit: 8, order: "id desc" }
  );
  const sampleInvoiceId = asOdooId(recent.find((order) => asOdooId(order.account_move))?.account_move);
  const sampleInvoices = sampleInvoiceId
    ? await client.searchRead(
        "account.move",
        [["id", "=", sampleInvoiceId]],
        ["id", "name", "move_type", "journal_id", "state", "invoice_pdf_report_id"],
        { limit: 1 }
      )
    : [];
  return {
    configName: posConfigName(),
    configId,
    configLabel: config ? String(config.name || "") : "",
    invoiceJournal: many2oneName(config?.invoice_journal_id),
    invoiceJournalId: asOdooId(config?.invoice_journal_id),
    openSessionId: asOdooId(sessions.find((session) => ["opened", "opening_control"].includes(String(session.state)))?.id),
    sessions: sessions.map((session) => ({
      id: asOdooId(session.id),
      name: String(session.name || ""),
      state: String(session.state || ""),
    })),
    paymentMethodId: pickPosPaymentMethod(methods),
    paymentMethods: methods.map((method) => ({
      id: asOdooId(method.id),
      name: String(method.name || ""),
      type: String(method.type || ""),
      journalId: asOdooId(method.journal_id),
    })),
    recentOrders: recent.map((order) => ({
      id: asOdooId(order.id),
      name: String(order.name || ""),
      reference: String(order.pos_reference || ""),
      state: String(order.state || ""),
      invoiceId: asOdooId(order.account_move),
      total: Number(order.amount_total || 0),
    })),
    sampleInvoice: sampleInvoices[0]
      ? {
          id: asOdooId(sampleInvoices[0].id),
          name: String(sampleInvoices[0].name || ""),
          moveType: String(sampleInvoices[0].move_type || ""),
          journal: many2oneName(sampleInvoices[0].journal_id),
          journalId: asOdooId(sampleInvoices[0].journal_id),
          state: String(sampleInvoices[0].state || ""),
          hasOfficialPdf: Boolean(asOdooId(sampleInvoices[0].invoice_pdf_report_id)),
        }
      : null,
  };
}

async function fieldsOf(client: PosRpcClient, model: string) {
  try {
    const fields = (await client.executeKw(model, "fields_get", [], { attributes: ["type"] })) as Record<
      string,
      unknown
    >;
    return new Set(Object.keys(fields || {}));
  } catch {
    return new Set<string>();
  }
}

function pickExisting(fields: Set<string>, candidates: string[]) {
  return candidates.find((name) => fields.has(name)) || "";
}

export function extractPosOrderId(result: unknown): number {
  if (typeof result === "number" || typeof result === "string") return asOdooId(result);
  if (Array.isArray(result)) {
    for (const item of result) {
      const id = extractPosOrderId(item);
      if (id) return id;
    }
    return 0;
  }
  if (!result || typeof result !== "object") return 0;
  const record = result as Record<string, unknown>;
  if (record.id) return asOdooId(record.id);
  if (record.res_id) return asOdooId(record.res_id);
  return extractPosOrderId(record["pos.order"]);
}

async function productTaxIds(client: PosRpcClient, productIds: number[]) {
  const rows = await client.searchRead("product.product", [["id", "in", productIds]], ["id", "taxes_id"], {
    limit: productIds.length,
  });
  const taxes = new Map<number, number[]>();
  for (const row of rows) {
    taxes.set(asOdooId(row.id), idList(row.taxes_id));
  }
  return taxes;
}

async function createPosOrder(
  client: PosRpcClient,
  values: Record<string, unknown>,
  uiOrder: Record<string, unknown>
) {
  try {
    const created = asOdooId(await client.executeKw("pos.order", "create", [values]));
    if (created) return created;
  } catch {
    // Odoo.com / recent POS builds often reject raw create; use the public UI sync next.
  }
  for (const method of ["sync_from_ui", "create_from_ui"]) {
    try {
      const result = await client.executeKw("pos.order", method, [[uiOrder]]);
      const id = extractPosOrderId(result);
      if (id) return id;
    } catch {
      // Try the next public POS import method.
    }
  }
  throw new Error("Odoo rejected pos.order.create and the public POS UI sync methods.");
}

export async function findExistingPosOrder(client: PosRpcClient, orderNumber: string) {
  const orderFields = await fieldsOf(client, "pos.order");
  const rows = await client.searchRead(
    "pos.order",
    posOrderSearchDomain(orderNumber, orderFields),
    ["id", "account_move", "state"],
    {
      limit: 1,
      order: "id desc",
    }
  );
  const row = rows[0];
  if (!row) return { posOrderId: 0, invoiceId: 0, state: "" };
  return {
    posOrderId: asOdooId(row.id),
    invoiceId: asOdooId(row.account_move),
    state: String(row.state || ""),
  };
}

async function resolvePosConfigId(client: PosRpcClient) {
  const wanted = posConfigName();
  const fields = ["id", "name", "payment_method_ids", "invoice_journal_id", "company_id"];
  const exact = await client.searchRead("pos.config", [["name", "ilike", wanted]], fields, {
    limit: 5,
  });
  const match =
    exact.find((row) => String(row.name || "").toLowerCase() === wanted.toLowerCase()) || exact[0];
  if (match) {
    return {
      id: asOdooId(match.id),
      paymentMethodIds: idList(match.payment_method_ids),
      invoiceJournalId: asOdooId(match.invoice_journal_id),
      companyId: asOdooId(match.company_id),
    };
  }
  const all = await client.searchRead("pos.config", [], fields, { limit: 20 });
  const fallback = all[0];
  if (!fallback) throw new Error("No Odoo POS configuration found.");
  return {
    id: asOdooId(fallback.id),
    paymentMethodIds: idList(fallback.payment_method_ids),
    invoiceJournalId: asOdooId(fallback.invoice_journal_id),
    companyId: asOdooId(fallback.company_id),
  };
}

async function resolvePaymentMethodId(client: PosRpcClient, methodIds: number[]) {
  const configured = Number(process.env.ODOO_POS_PAYMENT_METHOD_ID || 0);
  if (configured > 0) return configured;
  if (!methodIds.length) {
    const all = await client.searchRead("pos.payment.method", [], ["id", "name", "type", "is_cash_count", "journal_id"], { limit: 30 });
    const picked = pickPosPaymentMethod(all);
    if (!picked) throw new Error("No Odoo POS payment method found.");
    return picked;
  }
  const methods = await client.searchRead(
    "pos.payment.method",
    [["id", "in", methodIds]],
    ["id", "name", "type", "is_cash_count", "journal_id"],
    { limit: 30 }
  );
  const picked = pickPosPaymentMethod(methods);
  if (!picked) throw new Error("Loja Carcavelos POS has no usable payment method.");
  return picked;
}

async function ensureOpenSession(client: PosRpcClient, configId: number) {
  const openStates = ["opened", "opening_control"];
  const existing = await client.searchRead(
    "pos.session",
    [
      ["config_id", "=", configId],
      ["state", "in", openStates],
    ],
    ["id", "state"],
    { limit: 1, order: "id desc" }
  );
  if (asOdooId(existing[0]?.id)) return asOdooId(existing[0].id);

  const openers = ["open_ui", "open_session_cb"];
  for (const method of openers) {
    try {
      await client.executeKw("pos.config", method, [[configId]]);
      break;
    } catch {
      // Try the next public session opener.
    }
  }

  const afterOpen = await client.searchRead(
    "pos.session",
    [
      ["config_id", "=", configId],
      ["state", "in", openStates],
    ],
    ["id"],
    { limit: 1, order: "id desc" }
  );
  if (asOdooId(afterOpen[0]?.id)) return asOdooId(afterOpen[0].id);

  const sessionId = asOdooId(await client.executeKw("pos.session", "create", [{ config_id: configId }]));
  if (!sessionId) throw new Error("Could not create a Loja Carcavelos POS session.");
  try {
    await client.executeKw("pos.session", "set_opening_control", [[sessionId], 0, "Website"]);
  } catch {
    // Optional on some Odoo versions.
  }
  try {
    await client.executeKw("pos.session", "action_pos_session_open", [[sessionId]]);
  } catch {
    // Session may already be opened by create.
  }
  return sessionId;
}

async function invoiceIdForPosOrder(client: PosRpcClient, posOrderId: number) {
  const rows = await client.searchRead("pos.order", [["id", "=", posOrderId]], ["id", "account_move", "state"], {
    limit: 1,
  });
  return asOdooId(rows[0]?.account_move);
}

async function shopInvoiceMoveType(client: PosRpcClient, configId: number) {
  const invoiced = await client.searchRead(
    "pos.order",
    [
      ["config_id", "=", configId],
      ["account_move", "!=", false],
    ],
    ["account_move"],
    { limit: 1, order: "id desc" }
  );
  const invoiceId = asOdooId(invoiced[0]?.account_move);
  if (!invoiceId) return "out_invoice";
  const moves = await client.searchRead("account.move", [["id", "=", invoiceId]], ["move_type"], { limit: 1 });
  return String(moves[0]?.move_type || "out_invoice") || "out_invoice";
}

async function createFallbackPosInvoice(
  client: PosRpcClient,
  posOrderId: number,
  invoiceJournalId: number,
  companyId: number
) {
  if (!invoiceJournalId) {
    throw new Error("Loja Carcavelos has no invoice journal for fatura-recibo.");
  }
  const orders = await client.searchRead(
    "pos.order",
    [["id", "=", posOrderId]],
    ["id", "name", "partner_id", "config_id"],
    { limit: 1 }
  );
  const order = orders[0];
  if (!order) throw new Error("POS order disappeared before invoicing.");
  const lines = await client.searchRead(
    "pos.order.line",
    [["order_id", "=", posOrderId]],
    ["product_id", "qty", "price_unit", "full_product_name", "name"],
    { limit: 50 }
  );
  const moveType = await shopInvoiceMoveType(client, asOdooId(order.config_id) || 0);
  const values: Record<string, unknown> = {
    move_type: moveType,
    journal_id: invoiceJournalId,
    partner_id: asOdooId(order.partner_id),
    invoice_origin: String(order.name || ""),
    ref: String(order.name || ""),
    invoice_line_ids: lines.map((line) => [
      0,
      0,
      {
        product_id: asOdooId(line.product_id),
        quantity: Number(line.qty || 1),
        price_unit: Number(line.price_unit || 0),
        name: String(line.full_product_name || line.name || ""),
      },
    ]),
  };
  if (companyId) values.company_id = companyId;
  const moveId = asOdooId(await client.executeKw("account.move", "create", [values]));
  if (!moveId) throw new Error("Odoo did not create the fatura-recibo journal entry.");
  await client.executeKw("account.move", "action_post", [[moveId]]);
  await client.executeKw("pos.order", "write", [[posOrderId], { account_move: moveId, to_invoice: true, state: "invoiced" }]);
  return moveId;
}

async function invoicePosOrder(
  client: PosRpcClient,
  posOrderId: number,
  invoiceJournalId: number,
  companyId: number
) {
  const existing = await invoiceIdForPosOrder(client, posOrderId);
  if (existing) return existing;
  const context: Record<string, unknown> = {};
  if (invoiceJournalId) context.default_journal_id = invoiceJournalId;
  if (companyId) {
    context.allowed_company_ids = [companyId];
    context.force_company = companyId;
  }
  try {
    await client.executeKw("pos.order", "write", [[posOrderId], { to_invoice: true }]);
  } catch {
    // Optional.
  }
  try {
    await client.executeKw("pos.order", "action_pos_order_invoice", [[posOrderId]], { context });
  } catch {
    return createFallbackPosInvoice(client, posOrderId, invoiceJournalId, companyId);
  }
  return (
    (await invoiceIdForPosOrder(client, posOrderId)) ||
    createFallbackPosInvoice(client, posOrderId, invoiceJournalId, companyId)
  );
}

export async function registerPaidPosOrder(
  client: PosRpcClient,
  input: {
    orderNumber: string;
    partnerId: number;
    totalCents: number;
    taxCents: number;
    notes?: string | null;
    items: Array<{ odooProductId: number | null; name: string; quantity: number; unitPriceCents: number; totalCents: number }>;
  }
) {
  const existing = await findExistingPosOrder(client, input.orderNumber);
  if (existing.posOrderId && existing.invoiceId) {
    return { posOrderId: existing.posOrderId, invoiceId: existing.invoiceId, created: false };
  }

  const products = input.items.filter((item) => asOdooId(item.odooProductId));
  if (!products.length || products.length !== input.items.length) {
    throw new Error("All order items must have Odoo product IDs before creating a POS sale.");
  }
  if (!input.partnerId) {
    throw new Error("A customer partner is required to generate a POS fatura-recibo.");
  }

  const config = await resolvePosConfigId(client);
  const sessionId = await ensureOpenSession(client, config.id);
  const paymentMethodId = await resolvePaymentMethodId(client, config.paymentMethodIds);
  const lineFields = await fieldsOf(client, "pos.order.line");
  const orderFields = await fieldsOf(client, "pos.order");
  const qtyField = pickExisting(lineFields, ["qty", "product_uom_qty"]) || "qty";
  const amount = Number((input.totalCents / 100).toFixed(2));
  const tax = Number((input.taxCents / 100).toFixed(2));
  const taxesByProduct = await productTaxIds(
    client,
    products.map((item) => asOdooId(item.odooProductId))
  );
  const orderUuid = crypto.randomUUID();

  const lines = products.map((item) => {
    const qty = item.quantity;
    const priceUnit = Number((item.unitPriceCents / 100).toFixed(2));
    const lineTotal = Number((item.totalCents / 100).toFixed(2));
    const taxIds = taxesByProduct.get(asOdooId(item.odooProductId)) || [];
    const values: Record<string, unknown> = {
      product_id: item.odooProductId,
      [qtyField]: qty,
      price_unit: priceUnit,
      full_product_name: item.name,
      name: item.name,
    };
    if (lineFields.has("price_subtotal_incl")) values.price_subtotal_incl = lineTotal;
    if (lineFields.has("price_subtotal")) values.price_subtotal = lineTotal;
    if (lineFields.has("price_type")) values.price_type = "original";
    if (lineFields.has("discount")) values.discount = 0;
    if (lineFields.has("tax_ids") && taxIds.length) values.tax_ids = [[6, false, taxIds]];
    if (lineFields.has("uuid")) values.uuid = crypto.randomUUID();
    return [0, 0, values];
  });

  const payments = [
    [
      0,
      0,
      {
        payment_method_id: paymentMethodId,
        amount,
        uuid: crypto.randomUUID(),
      },
    ],
  ];

  const values: Record<string, unknown> = {
    session_id: sessionId,
    partner_id: input.partnerId,
    lines,
    payment_ids: payments,
    to_invoice: false,
    amount_total: amount,
    amount_paid: amount,
    amount_tax: tax,
    amount_return: 0,
  };
  const note = [input.orderNumber, input.notes].filter(Boolean).join("\n");
  if (orderFields.has("pos_reference")) values.pos_reference = input.orderNumber;
  if (orderFields.has("note")) values.note = note;
  if (orderFields.has("tracking_number")) values.tracking_number = input.orderNumber.slice(-8);
  if (orderFields.has("uuid")) values.uuid = orderUuid;
  if (orderFields.has("source")) values.source = "pos";

  const uiOrder: Record<string, unknown> = {
    ...values,
    uuid: orderUuid,
    name: input.orderNumber,
    state: "paid",
  };

  let posOrderId = existing.posOrderId;
  if (!posOrderId) {
    posOrderId = await createPosOrder(client, values, uiOrder);
  }
  if (!posOrderId) throw new Error("Odoo did not create a POS order.");

  const current = await client.searchRead("pos.order", [["id", "=", posOrderId]], ["state", "account_move"], { limit: 1 });
  const state = String(current[0]?.state || "");
  if (state !== "invoiced" && state !== "paid" && state !== "done") {
    try {
      await client.executeKw("pos.order", "action_pos_order_paid", [[posOrderId]]);
    } catch (error) {
      const invoiceId = await invoiceIdForPosOrder(client, posOrderId);
      if (!invoiceId) throw error;
    }
  }

  const invoiceId = await invoicePosOrder(client, posOrderId, config.invoiceJournalId, config.companyId);
  if (!invoiceId) {
    throw new Error("Odoo POS sale was created but no fatura-recibo (account.move) was generated.");
  }
  return { posOrderId, invoiceId, created: true };
}
