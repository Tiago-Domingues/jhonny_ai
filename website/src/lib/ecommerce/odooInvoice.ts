export function pdfBufferFromOdooResult(result: unknown): Buffer | null {
  const candidates = Array.isArray(result) ? result : [result];
  for (const candidate of candidates) {
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
];

type InvoiceRpcClient = {
  executeKw: (...args: any[]) => Promise<unknown>;
  searchRead: (...args: any[]) => Promise<Record<string, unknown>[]>;
};

export async function fetchOdooInvoicePdf(client: InvoiceRpcClient, invoiceId: number) {
  if (!invoiceId) return null;

  for (const report of ODOO_INVOICE_REPORTS) {
    try {
      const rendered = await client.executeKw("ir.actions.report", "_render_qweb_pdf", [report, [invoiceId]]);
      const pdf = pdfBufferFromOdooResult(rendered);
      if (pdf) return pdf;
    } catch {
      // Try the next official report name.
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
    { limit: 1, order: "id desc" }
  );
  const data = attachments[0]?.datas;
  return typeof data === "string" ? pdfBufferFromOdooResult(data) : null;
}
