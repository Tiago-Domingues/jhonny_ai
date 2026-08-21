import {
  localStockAfterSale,
  odooQtyByProductId,
  openPickingIds,
  shouldValidateDelivery,
  stockFieldsFromQty,
  validateOpenPickings,
  wizardModel,
  wizardProcessMethod,
  type OdooRpcClient,
} from "../src/lib/ecommerce/odooStock";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(shouldValidateDelivery(undefined) === true, "delivery validate defaults on");
assert(shouldValidateDelivery("true") === true, "true still validates");
assert(shouldValidateDelivery("false") === false, "false is the emergency opt-out");

assert(openPickingIds([{ id: 11, state: "assigned" }, { id: 12, state: "done" }, { id: 13, state: "cancel" }]).join() === "11", "only open pickings are validated");
assert(wizardModel({ res_model: "stock.immediate.transfer", res_id: 9 }) === "stock.immediate.transfer", "immediate transfer wizard is detected");
assert(wizardModel(true) === null, "boolean validate result is not a wizard");
assert(wizardProcessMethod("stock.backorder.confirmation") === "process_cancel_backorder", "backorders are cancelled so stock fully leaves");
assert(wizardProcessMethod("stock.immediate.transfer") === "process", "immediate transfer uses process");

const after = localStockAfterSale(5, 2, true);
assert(after.stockQuantity === 3, "local fallback decrements sold qty");
assert(after.availableForSale === true, "remaining stock stays saleable");
assert(localStockAfterSale(1, 1).stockQuantity === 0, "sold-out local qty is zero");
assert(localStockAfterSale(1, 1).availableForSale === false, "sold-out is not for sale");
assert(stockFieldsFromQty(2).stockState === "low_stock", "qty 2 is low stock");

assert(odooQtyByProductId([{ id: 88, qty_available: 4.7 }]).get(88) === 4, "Odoo qty is floored");

type Call = { model: string; method: string; args?: unknown[] };
const calls: Call[] = [];
const client: OdooRpcClient = {
  async searchRead(model, domain) {
    if (model === "stock.picking") {
      return [{ id: 21, state: "assigned" }];
    }
    if (model === "stock.move.line") {
      return [{ id: 31, product_uom_qty: 2, quantity: 0 }];
    }
    return [];
  },
  async executeKw(model, method, args) {
    calls.push({ model, method, args });
    if (model === "stock.move.line" && method === "write") return true;
    if (model === "stock.picking" && method === "button_validate") {
      return { res_model: "stock.immediate.transfer" };
    }
    if (model === "stock.immediate.transfer" && method === "create") return 41;
    if (model === "stock.immediate.transfer" && method === "process") return true;
    return true;
  },
};

const previous = process.env.ODOO_AUTO_VALIDATE_DELIVERY;
delete process.env.ODOO_AUTO_VALIDATE_DELIVERY;

async function run() {
  const result = await validateOpenPickings(client, 1001);
  assert(result.validated === 1 && result.skipped === false, "open picking is validated");
  assert(
    calls.some((call) => call.model === "stock.move.line" && call.method === "write"),
    "qty_done is set before validate"
  );
  assert(
    calls.some((call) => call.model === "stock.picking" && call.method === "button_validate"),
    "button_validate is called per picking"
  );
  assert(
    calls.some((call) => call.model === "stock.immediate.transfer" && call.method === "process"),
    "immediate transfer wizard is processed"
  );

  process.env.ODOO_AUTO_VALIDATE_DELIVERY = "false";
  const skipped = await validateOpenPickings(client, 1001);
  assert(skipped.skipped === true && skipped.validated === 0, "env false skips Odoo delivery validate");
  if (previous === undefined) delete process.env.ODOO_AUTO_VALIDATE_DELIVERY;
  else process.env.ODOO_AUTO_VALIDATE_DELIVERY = previous;

  console.log("odoo paid-order stock helpers ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
