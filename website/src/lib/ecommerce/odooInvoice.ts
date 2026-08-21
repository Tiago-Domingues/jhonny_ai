export function pdfBufferFromOdooResult(result: unknown): Buffer | null {
  const candidates = Array.isArray(result) ? result : [result];
  for (const candidate of candidates) {
    if (Buffer.isBuffer(candidate) && candidate.length > 4 && candidate.subarray(0, 4).toString() === "%PDF") {
      return candidate;
    }
    if (candidate instanceof Uint8Array && candidate.length > 4) {
      const buffer = Buffer.from(candidate);
      if (buffer.subarray(0, 4).toString() === "%PDF") return buffer;
    }
    if (typeof candidate === "string" && candidate.length > 80) {
      const buffer = Buffer.from(candidate, "base64");
      if (buffer.length > 4 && buffer.subarray(0, 4).toString() === "%PDF") return buffer;
      if (buffer.length > 100) return buffer;
    }
  }
  return null;
}

export const ODOO_INVOICE_REPORTS = [
  "account.account_invoices",
  "account.report_invoice_with_payments",
  "account.report_invoice",
  "account.account_invoices_without_payment",
];

export const ODOO_PUBLIC_INVOICE_RENDER_METHODS = ["render_qweb_pdf", "render_qweb_pdf_content"] as const;

type InvoiceRpcClient = {
  executeKw: (...args: any[]) => Promise<unknown>;
  searchRead: (...args: any[]) => Promise<Record<string, unknown>[]>;
  downloadReportPdf?: (reportXmlId: string, recordIds: number[]) => Promise<Buffer | null>;
};

export function saleOrderInvoiceContext(saleOrderId: number) {
  return {
    active_model: "sale.order",
    active_id: saleOrderId,
    active_ids: [saleOrderId],
    open_invoices: true,
  };
}

export function accountMovePaymentContext(invoiceId: number) {
  return {
    active_model: "account.move",
    active_id: invoiceId,
    active_ids: [invoiceId],
  };
}

function asIdList(value: unknown): number[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => asIdList(item));
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.res_model && record.res_model !== "account.move" && record.res_model !== "account.move.line") {
      return asIdList(record.res_id).concat(idsFromDomain(record.domain));
    }
    const ids = asIdList(record.res_id)
      .concat(asIdList(record.invoice_ids))
      .concat(idsFromDomain(record.domain));
    if (record.res_model === "account.move" || record.res_model === "account.move.line") {
      return ids.concat(asIdList(record.id));
    }
    return ids.length ? ids : asIdList(record.id);
  }
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? [id] : [];
}

function idsFromDomain(domain: unknown): number[] {
  if (!Array.isArray(domain)) return [];
  for (const term of domain) {
    if (!Array.isArray(term) || term.length < 3) continue;
    if (term[0] !== "id") continue;
    const operator = String(term[1]);
    const value = term[2];
    if (operator === "in" && Array.isArray(value)) return asIdList(value);
    if (operator === "=") return asIdList(value);
  }
  return [];
}

export function parseAccountMoveIds(result: unknown): number[] {
  if (result == null || result === false) return [];
  if (typeof result === "number") return asIdList(result);
  if (Array.isArray(result)) {
    const fromDomain = idsFromDomain(result);
    if (fromDomain.length) return uniqueIds(fromDomain);
    return uniqueIds(asIdList(result));
  }
  if (typeof result === "object") {
    const record = result as Record<string, unknown>;
    if (String(record.type || "").startsWith("ir.actions")) {
      return uniqueIds(
        asIdList(record.res_id).concat(idsFromDomain(record.domain)).concat(asIdList(record.invoice_ids))
      );
    }
    const ids = asIdList(record.res_id)
      .concat(idsFromDomain(record.domain))
      .concat(asIdList(record.invoice_ids));
    if (record.res_model === "account.move" || record.res_model === "account.move.line") {
      ids.push(...asIdList(record.id));
    }
    return uniqueIds(ids);
  }
  return [];
}

function uniqueIds(ids: number[]) {
  return [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
}

export function isFaturaReciboJournal(journal: { name?: unknown; code?: unknown }) {
  const name = String(journal.name || "").toLowerCase();
  const code = String(journal.code || "").toLowerCase();
  return (
    name.includes("recibo") ||
    name.includes("fatura-recibo") ||
    name.includes("fatura recibo") ||
    name.includes("invoice receipt") ||
    name.includes("invoice-receipt") ||
    code === "fr" ||
    code.startsWith("fr")
  );
}

function asAddress(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, string>;
}

export function odooFiscalAddress(order: {
  shippingAddressJson?: unknown;
  billingAddressJson?: unknown;
}) {
  const billing = asAddress(order.billingAddressJson);
  const shipping = asAddress(order.shippingAddressJson);
  if (billing.addressLine1 || billing.postalCode || billing.city || billing.country) return billing;
  return shipping;
}

export function odooPartnerValues(order: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerVat?: string | null;
  shippingAddressJson?: unknown;
  billingAddressJson?: unknown;
}) {
  const address = odooFiscalAddress(order);
  const payload: Record<string, string | number> = {
    name: order.customerName,
    email: order.customerEmail,
    phone: order.customerPhone || "",
    street: address.addressLine1 || "",
    street2: address.addressLine2 || "",
    zip: address.postalCode || "",
    city: address.city || "",
    customer_rank: 1,
  };
  if (order.customerVat) payload.vat = order.customerVat;
  return payload;
}

export function odooPartnerCountryCode(order: {
  shippingAddressJson?: unknown;
  billingAddressJson?: unknown;
}) {
  const address = odooFiscalAddress(order);
  const code = String(address.country || "PT").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "PT";
}

function asOdooId(value: unknown): number {
  if (Array.isArray(value)) return asOdooId(value[0]);
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

export async function runSaleInvoiceWizard(client: InvoiceRpcClient, saleOrderId: number) {
  const context = saleOrderInvoiceContext(saleOrderId);
  let wizardId = 0;
  try {
    wizardId = asOdooId(
      await client.executeKw(
        "sale.advance.payment.inv",
        "create",
        [
          {
            advance_payment_method: "delivered",
            sale_order_ids: [[6, 0, [saleOrderId]]],
          },
        ],
        { context }
      )
    );
  } catch {
    wizardId = asOdooId(
      await client.executeKw("sale.advance.payment.inv", "create", [{ advance_payment_method: "delivered" }], {
        context,
      })
    );
  }
  if (!wizardId) {
    throw new Error("Odoo invoice wizard could not be created.");
  }

  const result = await client.executeKw("sale.advance.payment.inv", "create_invoices", [[wizardId]], { context });
  return parseAccountMoveIds(result);
}

export async function fetchOdooInvoicePdf(client: InvoiceRpcClient, invoiceId: number) {
  if (!invoiceId) return null;

  if (client.downloadReportPdf) {
    for (const report of ODOO_INVOICE_REPORTS) {
      try {
        const pdf = await client.downloadReportPdf(report, [invoiceId]);
        if (pdf) return pdf;
      } catch {
        // Try the next report / method.
      }
    }
  }

  for (const method of ODOO_PUBLIC_INVOICE_RENDER_METHODS) {
    for (const report of ODOO_INVOICE_REPORTS) {
      try {
        const rendered = await client.executeKw("ir.actions.report", method, [report, [invoiceId]]);
        const pdf = pdfBufferFromOdooResult(rendered);
        if (pdf) return pdf;
      } catch {
        // Private/unavailable render methods are expected on Odoo.com.
      }
    }
  }

  const attachments = await client.searchRead(
    "ir.attachment",
    [
      ["res_model", "=", "account.move"],
      ["res_id", "=", invoiceId],
      ["mimetype", "=", "application/pdf"],
    ],
    ["datas", "name"],
    { limit: 5, order: "id desc" }
  );
  for (const attachment of attachments) {
    const pdf = typeof attachment.datas === "string" ? pdfBufferFromOdooResult(attachment.datas) : null;
    if (pdf) return pdf;
  }
  return null;
}
