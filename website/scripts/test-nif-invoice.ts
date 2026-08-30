import { isValidOptionalNif, normalizeNif } from "../src/lib/ecommerce/nif";
import {
  fetchOdooInvoicePdf,
  isFaturaReciboJournal,
  odooPartnerCountryCode,
  odooPartnerValues,
  parseAccountMoveIds,
  pdfBufferFromOdooResult,
  readStoredInvoicePdf,
  runSaleInvoiceWizard,
  saleOrderInvoiceContext,
} from "../src/lib/ecommerce/odooInvoice";
import { isPaidCustomerFaturaEmailSubject } from "../src/lib/ecommerce/emailSubjects";
import { profileSchema } from "../src/lib/ecommerce/schemas";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(isValidOptionalNif(""), "empty NIF is valid");
assert(isValidOptionalNif(null), "missing NIF is valid");
assert(isValidOptionalNif("123456789"), "9-digit NIF is valid");
assert(isValidOptionalNif("PT123456789"), "PT-prefixed NIF is valid");
assert(isValidOptionalNif("ESB12345678"), "EU VAT-style NIF is valid");
assert(!isValidOptionalNif("12345678"), "8-digit NIF is invalid");
assert(!isValidOptionalNif("NIF"), "letters-only NIF is invalid");

assert(normalizeNif("123456789") === "PT123456789", "bare PT NIF gets PT prefix");
assert(normalizeNif(" 123 456 789 ") === "PT123456789", "spaces are stripped");
assert(normalizeNif("pt-123.456.789") === "PT123456789", "punctuation is stripped");
assert(normalizeNif("ESB12345678") === "ESB12345678", "EU VAT is left with country prefix");
assert(normalizeNif("") === "", "empty NIF stays empty");

const profile = profileSchema.parse({
  fullName: "Ana Silva",
  customerType: "SURFER",
  phoneCountryCode: "+351",
  phone: "912345678",
  nif: "123456789",
});
assert(profile.nif === "123456789", "profile schema accepts optional NIF");

const badProfile = profileSchema.safeParse({
  fullName: "Ana Silva",
  customerType: "SURFER",
  phoneCountryCode: "+351",
  phone: "912345678",
  nif: "xx",
});
assert(!profileSchema.safeParse({ fullName: "Ana Silva", customerType: "SURFER" }).success, "profile schema requires phone");
assert(!badProfile.success, "profile schema rejects invalid NIF");

const pdfHeader = Buffer.from(`%PDF-1.4\n${"x".repeat(120)}`).toString("base64");
const pdf = pdfBufferFromOdooResult([pdfHeader, "filename.pdf"]);
assert(pdf && pdf.subarray(0, 4).toString() === "%PDF", "Odoo report tuple extracts a PDF buffer");
assert(pdfBufferFromOdooResult("short") === null, "short strings are not treated as PDFs");
assert(pdfBufferFromOdooResult(null) === null, "null Odoo result yields no PDF");

assert(parseAccountMoveIds(41)[0] === 41, "numeric wizard result is an invoice id");
assert(parseAccountMoveIds({ res_model: "account.move", res_id: 77 })[0] === 77, "window action res_id is parsed");
assert(
  parseAccountMoveIds({ domain: [["id", "in", [12, 13]]] }).join() === "12,13",
  "window action domain ids are parsed"
);
assert(parseAccountMoveIds(false).length === 0, "false wizard result is empty");
assert(
  parseAccountMoveIds({ type: "ir.actions.act_window_close", id: 999 }).length === 0,
  "window-close actions do not use the action id as an invoice"
);
assert(
  parseAccountMoveIds({
    type: "ir.actions.act_window",
    res_model: "account.move",
    res_id: 41,
    id: 999,
  }).join() === "41",
  "invoice window action uses res_id, not the action database id"
);
assert(
  isPaidCustomerFaturaEmailSubject("Pagamento confirmado — JSS-260821161346-H094"),
  "paid customer fatura email is detected by subject"
);
assert(
  !isPaidCustomerFaturaEmailSubject("Pagamento recebido — JSS-260821161346-H094"),
  "owner paid email is not treated as the customer fatura mail"
);
assert(isFaturaReciboJournal({ name: "Fatura-Recibo", code: "FR" }), "FR journal is detected by name/code");
assert(!isFaturaReciboJournal({ name: "Customer Invoices", code: "INV" }), "normal sales journal is not FR");

const partner = odooPartnerValues({
  customerName: "Ana Silva",
  customerEmail: "ana@example.com",
  customerPhone: "912000000",
  customerVat: "PT241984700",
  shippingAddressJson: { addressLine1: "Rua A", postalCode: "1000-001", city: "Lisboa", country: "PT" },
  billingAddressJson: { addressLine1: "Rua Fiscal 1", postalCode: "2775-597", city: "Carcavelos", country: "PT" },
});
assert(partner.vat === "PT241984700", "NIF is written to the Odoo partner");
assert(partner.street === "Rua Fiscal 1", "billing address is preferred for the fatura");
assert(odooPartnerCountryCode({ billingAddressJson: { country: "es" } }) === "ES", "billing country is used for partner");
assert(saleOrderInvoiceContext(9).active_ids[0] === 9, "invoice wizard context targets the sale order");
assert(saleOrderInvoiceContext(9).open_invoices === true, "wizard asks Odoo to return the created invoice");

async function run() {
  const wizardCalls: Array<{ model: string; method: string; kwargs?: unknown }> = [];
  const wizardClient = {
    async executeKw(model: string, method: string, args?: unknown[], kwargs?: unknown) {
      wizardCalls.push({ model, method, kwargs });
      if (model === "sale.advance.payment.inv" && method === "create") return 55;
      if (model === "sale.advance.payment.inv" && method === "create_invoices") {
        return { type: "ir.actions.act_window", res_model: "account.move", res_id: 88, id: 321 };
      }
      throw new Error(`unexpected ${model}.${method}`);
    },
    async searchRead() {
      return [];
    },
  };
  const invoiceIds = await runSaleInvoiceWizard(wizardClient, 6);
  assert(invoiceIds.join() === "88", "public invoice wizard returns the created account.move id");
  assert(
    wizardCalls.every((call) => call.model === "sale.advance.payment.inv"),
    "invoices are created through sale.advance.payment.inv"
  );
  assert(
    wizardCalls.some((call) => call.method === "create_invoices"),
    "public create_invoices is used instead of sale.order._create_invoices"
  );
  const createKwargs = wizardCalls.find((call) => call.method === "create")?.kwargs as { context?: { active_ids?: number[] } };
  assert(createKwargs?.context?.active_ids?.[0] === 6, "wizard context targets the website sale order");

  const storedPdf = Buffer.from(`%PDF-1.4\n${"stored".repeat(20)}`);
  const stored = await readStoredInvoicePdf(
    {
      async executeKw() {
        throw new Error("unused");
      },
      async searchRead() {
        return [{ invoice_pdf_report_file: storedPdf.toString("base64"), invoice_pdf_report_id: 12 }];
      },
    },
    88
  );
  assert(stored && stored.subarray(0, 4).toString() === "%PDF", "stored official invoice PDF is read from account.move");

  const generatedCalls: string[] = [];
  const generatedPdf = Buffer.from(`%PDF-1.4\n${"generated".repeat(16)}`);
  let generated = false;
  const generatedClient = {
    async executeKw(model: string, method: string) {
      generatedCalls.push(`${model}.${method}`);
      if (model === "account.move.send.wizard" && method === "create") return 44;
      if (model === "account.move.send.wizard" && method === "write") return true;
      if (model === "account.move.send.wizard" && method === "action_send_and_print") {
        generated = true;
        return true;
      }
      throw new Error(`unexpected ${model}.${method}`);
    },
    async searchRead(model: string) {
      if (model === "account.move") {
        return generated
          ? [{ invoice_pdf_report_file: generatedPdf.toString("base64"), invoice_pdf_report_id: 13 }]
          : [{ invoice_pdf_report_id: false }];
      }
      return [];
    },
  };
  const generatedFetched = await fetchOdooInvoicePdf(generatedClient, 88);
  assert(generatedFetched && generatedFetched.equals(generatedPdf), "Send & Print wizard stores the official fatura PDF");
  assert(
    generatedCalls.includes("account.move.send.wizard.action_send_and_print"),
    "official PDF is generated through the public send wizard"
  );
  assert(
    !generatedCalls.some((call) => call.includes("email") || call.includes("_render_qweb_pdf")),
    "wizard generation does not email from Odoo or call private render methods"
  );

  const calls: string[] = [];
  const invoicePdf = Buffer.from(`%PDF-1.4\n${"y".repeat(120)}`);
  const client = {
    async executeKw(model: string, method: string) {
      calls.push(`${model}.${method}`);
      throw new Error("private method blocked");
    },
    async searchRead() {
      return [];
    },
    async downloadInvoiceLegalPdf() {
      calls.push("downloadInvoiceLegalPdf");
      return invoicePdf;
    },
    async downloadReportPdf() {
      calls.push("downloadReportPdf");
      return invoicePdf;
    },
  };
  const fetched = await fetchOdooInvoicePdf(client, 88);
  assert(fetched && fetched.subarray(0, 4).toString() === "%PDF", "PDF is loaded via official invoice download");
  assert(calls.includes("downloadInvoiceLegalPdf"), "HTTP legal invoice download is used when no stored PDF exists");
  assert(
    !calls.some((call) => call.includes("_create_invoices") || call.includes("_render_qweb_pdf")),
    "private Odoo methods are not used to fetch the fatura PDF"
  );

  console.log("NIF + invoice PDF helpers ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
