import {
  extractPosOrderId,
  pickPosPaymentMethod,
  posConfigName,
  posOrderSearchDomain,
  registerPaidPosOrder,
} from "../src/lib/ecommerce/odooPos";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(posConfigName(undefined) === "Loja Carcavelos", "default POS is Loja Carcavelos");
assert(posConfigName(" Website ") === "Website", "POS name env is trimmed");

const bank = pickPosPaymentMethod([
  { id: 1, name: "Cash", type: "cash", is_cash_count: true, journal_id: 9 },
  { id: 2, name: "Stripe / MB WAY", type: "bank", journal_id: 11 },
  { id: 3, name: "Customer Account", type: "pay_later" },
]);
assert(bank === 2, "non-cash online method is preferred for website POS payments");
assert(
  pickPosPaymentMethod([
    { id: 2, name: "Cartão", type: "bank" },
    { id: 4, name: "Numerário", type: "cash", is_cash_count: true, journal_id: 9 },
  ]) === 4,
  "a payment method with a journal is required to post the fatura"
);
assert(pickPosPaymentMethod([]) === 0, "no methods yields 0");

const domain = posOrderSearchDomain("JSS-260821161346-H094");
assert(JSON.stringify(domain).includes("JSS-260821161346-H094"), "existing website order number is searchable on POS");
assert(JSON.stringify(domain).includes("pos_reference"), "POS lookup uses pos_reference");
const liveDomain = posOrderSearchDomain("JSS-260821161346-H094", ["pos_reference", "name"]);
assert(!JSON.stringify(liveDomain).includes("note"), "POS lookup skips note when the field does not exist");
assert(JSON.stringify(liveDomain).includes("pos_reference"), "POS lookup still uses pos_reference without note");
assert(extractPosOrderId({ "pos.order": [{ id: 88, account_move: 99 }] }) === 88, "UI sync result exposes pos.order id");
assert(extractPosOrderId([77]) === 77, "create_from_ui id list is parsed");

async function run() {
  const calls: string[] = [];
  const client = {
    async searchRead(model: string, domain: unknown[] = []) {
      if (model === "pos.order" && JSON.stringify(domain).includes("JSS-TEST-POS")) {
        return [];
      }
      if (model === "pos.order") {
        return [{ id: 88, account_move: 99, state: "invoiced" }];
      }
      if (model === "pos.config") {
        return [{ id: 3, name: "Loja Carcavelos", payment_method_ids: [2] }];
      }
      if (model === "pos.session") {
        return [{ id: 17, state: "opened" }];
      }
      if (model === "pos.payment.method") {
        return [{ id: 2, name: "Stripe / MB WAY", type: "bank" }];
      }
      if (model === "product.product") {
        return [{ id: 12, taxes_id: [1] }];
      }
      return [];
    },
    async executeKw(model: string, method: string) {
      calls.push(`${model}.${method}`);
      if (model === "pos.order.line" && method === "fields_get") {
        return { qty: { type: "float" }, price_unit: { type: "float" }, discount: { type: "float" }, tax_ids: { type: "many2many" }, uuid: { type: "char" } };
      }
      if (model === "pos.order" && method === "fields_get") {
        return { pos_reference: { type: "char" }, note: { type: "text" }, lines: { type: "one2many" }, uuid: { type: "char" } };
      }
      if (model === "pos.order" && method === "create") {
        throw new Error("Access Denied: create is restricted");
      }
      if (model === "pos.order" && method === "sync_from_ui") return { "pos.order": [{ id: 88, account_move: 99 }] };
      if (model === "pos.order" && method === "action_pos_order_paid") return true;
      if (model === "pos.order" && method === "action_pos_order_invoice") return { res_id: 99 };
      return true;
    },
  };

  const result = await registerPaidPosOrder(client, {
    orderNumber: "JSS-TEST-POS",
    partnerId: 41,
    subtotalCents: 1000,
    shippingCents: 490,
    discountCents: 100,
    totalCents: 1390,
    taxCents: 75,
    couponCode: "JHONNY10",
    couponPercentOff: 10,
    items: [{ odooProductId: 12, name: "COMB RANGE", quantity: 1, unitPriceCents: 1000, totalCents: 1000 }],
  });
  assert(result.posOrderId === 88 && result.invoiceId === 99, "POS create + invoice ids are stored");
  assert(
    !calls.some((call) => call.includes("_create_invoices") || call.includes("_generate_pos_order_invoice")),
    "private Odoo invoice methods are not used"
  );
  assert(calls.includes("pos.order.create"), "raw create is attempted first");
  assert(calls.includes("pos.order.sync_from_ui"), "public sync_from_ui is the fallback when create is denied");

  console.log("odoo POS helpers ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

