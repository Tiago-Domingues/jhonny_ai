import {
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
  { id: 1, name: "Cash", type: "cash", is_cash_count: true },
  { id: 2, name: "Stripe / MB WAY", type: "bank" },
  { id: 3, name: "Customer Account", type: "pay_later" },
]);
assert(bank === 2, "non-cash online method is preferred for website POS payments");
assert(pickPosPaymentMethod([]) === 0, "no methods yields 0");

const domain = posOrderSearchDomain("JSS-260821161346-H094");
assert(JSON.stringify(domain).includes("JSS-260821161346-H094"), "existing website order number is searchable on POS");
assert(JSON.stringify(domain).includes("pos_reference"), "POS lookup uses pos_reference");

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
      return [];
    },
    async executeKw(model: string, method: string) {
      calls.push(`${model}.${method}`);
      if (model === "pos.order.line" && method === "fields_get") return { qty: { type: "float" }, price_unit: { type: "float" } };
      if (model === "pos.order" && method === "fields_get") {
        return { pos_reference: { type: "char" }, note: { type: "text" }, lines: { type: "one2many" } };
      }
      if (model === "pos.order" && method === "create") return 88;
      if (model === "pos.order" && method === "action_pos_order_paid") return true;
      if (model === "pos.order" && method === "action_pos_order_invoice") return { res_id: 99 };
      return true;
    },
  };

  const result = await registerPaidPosOrder(client, {
    orderNumber: "JSS-TEST-POS",
    partnerId: 41,
    totalCents: 400,
    taxCents: 75,
    items: [{ odooProductId: 12, name: "COMB RANGE", quantity: 1, unitPriceCents: 400, totalCents: 400 }],
  });
  assert(result.posOrderId === 88 && result.invoiceId === 99, "POS create + invoice ids are stored");
  assert(
    !calls.some((call) => call.includes("_create_invoices") || call.includes("_generate_pos_order_invoice")),
    "private Odoo invoice methods are not used"
  );
  assert(
    calls.includes("pos.order.create") || calls.some((call) => call === "pos.order.create"),
    "a public pos.order create is used"
  );

  console.log("odoo POS helpers ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

