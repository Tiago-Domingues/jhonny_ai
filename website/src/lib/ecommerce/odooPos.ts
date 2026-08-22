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
  methods: Array<{ id?: unknown; name?: unknown; type?: unknown; is_cash_count?: unknown }>
) {
  if (!methods.length) return 0;
  const scored = methods.map((method) => {
    const name = String(method.name || "").toLowerCase();
    const type = String(method.type || "").toLowerCase();
    let score = 0;
    if (/stripe|mb ?way|multibanco|online|website|bank|cart|visa|mbway/.test(name)) score += 8;
    if (type === "bank" || type === "pay_later") score += 4;
    if (type === "cash" || method.is_cash_count) score -= 3;
    return { id: asOdooId(method.id), score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id || 0;
}

export function posOrderSearchDomain(orderNumber: string) {
  return [
    "|",
    "|",
    ["pos_reference", "=", orderNumber],
    ["name", "=", orderNumber],
    ["note", "ilike", orderNumber],
  ];
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
        ["id", "name", "type", "is_cash_count"],
        { limit: 30 }
      )
    : [];
  const recent = await client.searchRead(
    "pos.order",
    configId ? [["config_id", "=", configId]] : [],
    ["id", "name", "pos_reference", "state", "partner_id", "account_move", "amount_total", "to_invoice", "date_order"],
    { limit: 5, order: "id desc" }
  );
  return {
    configName: posConfigName(),
    configId,
    configLabel: config ? String(config.name || "") : "",
    invoiceJournal: many2oneName(config?.invoice_journal_id),
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
    })),
    recentOrders: recent.map((order) => ({
      id: asOdooId(order.id),
      name: String(order.name || ""),
      reference: String(order.pos_reference || ""),
      state: String(order.state || ""),
      invoiceId: asOdooId(order.account_move),
      total: Number(order.amount_total || 0),
    })),
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

export async function findExistingPosOrder(client: PosRpcClient, orderNumber: string) {
  const rows = await client.searchRead("pos.order", posOrderSearchDomain(orderNumber), ["id", "account_move", "state"], {
    limit: 1,
    order: "id desc",
  });
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
  const exact = await client.searchRead("pos.config", [["name", "ilike", wanted]], ["id", "name", "payment_method_ids"], {
    limit: 5,
  });
  const match =
    exact.find((row) => String(row.name || "").toLowerCase() === wanted.toLowerCase()) || exact[0];
  if (match) return { id: asOdooId(match.id), paymentMethodIds: idList(match.payment_method_ids) };
  const all = await client.searchRead("pos.config", [], ["id", "name", "payment_method_ids"], { limit: 20 });
  const fallback = all[0];
  if (!fallback) throw new Error("No Odoo POS configuration found.");
  return { id: asOdooId(fallback.id), paymentMethodIds: idList(fallback.payment_method_ids) };
}

async function resolvePaymentMethodId(client: PosRpcClient, methodIds: number[]) {
  const configured = Number(process.env.ODOO_POS_PAYMENT_METHOD_ID || 0);
  if (configured > 0) return configured;
  if (!methodIds.length) {
    const all = await client.searchRead("pos.payment.method", [], ["id", "name", "type", "is_cash_count"], { limit: 30 });
    const picked = pickPosPaymentMethod(all);
    if (!picked) throw new Error("No Odoo POS payment method found.");
    return picked;
  }
  const methods = await client.searchRead(
    "pos.payment.method",
    [["id", "in", methodIds]],
    ["id", "name", "type", "is_cash_count"],
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

  const lines = products.map((item) => {
    const qty = item.quantity;
    const priceUnit = Number((item.unitPriceCents / 100).toFixed(2));
    const lineTotal = Number((item.totalCents / 100).toFixed(2));
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
    return [0, 0, values];
  });

  const payments = [
    [
      0,
      0,
      {
        payment_method_id: paymentMethodId,
        amount,
      },
    ],
  ];

  const values: Record<string, unknown> = {
    session_id: sessionId,
    partner_id: input.partnerId,
    lines,
    payment_ids: payments,
    to_invoice: true,
    amount_total: amount,
    amount_paid: amount,
    amount_tax: tax,
    amount_return: 0,
  };
  const note = [input.orderNumber, input.notes].filter(Boolean).join("\n");
  if (orderFields.has("pos_reference")) values.pos_reference = input.orderNumber;
  if (orderFields.has("note")) values.note = note;
  if (orderFields.has("tracking_number")) values.tracking_number = input.orderNumber.slice(-8);

  let posOrderId = existing.posOrderId;
  if (!posOrderId) {
    posOrderId = asOdooId(await client.executeKw("pos.order", "create", [values]));
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

  let invoiceId = await invoiceIdForPosOrder(client, posOrderId);
  if (!invoiceId) {
    await client.executeKw("pos.order", "action_pos_order_invoice", [[posOrderId]]);
    invoiceId = await invoiceIdForPosOrder(client, posOrderId);
  }
  if (!invoiceId) {
    throw new Error("Odoo POS sale was created but no fatura-recibo (account.move) was generated.");
  }
  return { posOrderId, invoiceId, created: true };
}
