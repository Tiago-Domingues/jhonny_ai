/**
 * Offline checks for Ifthenpay order ids and callback parsing.
 * Run: cd website && npx tsx scripts/test-ifthenpay.mjs
 */
import {
  extractIfthenpayReference,
  extractIfthenpaySecret,
  extractIfthenpayStatus,
  ifthenpayCallbackUrlTemplates,
  ifthenpayOrderId,
  isIfthenpayGatewayAccepted,
  isPaidCallbackStatus,
  normalizePaymentReference,
  parseIfthenpayAmountCents,
} from "../src/lib/ecommerce/ifthenpay.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const orderNumber = "JSS-260820111900-ABCD";
const orderId = ifthenpayOrderId(orderNumber);
assert(orderId.length === 15, `orderId must be 15 chars, got ${orderId.length}: ${orderId}`);
assert(orderId.includes("ABCD"), `orderId should keep the random suffix: ${orderId}`);
assert(ifthenpayOrderId("JSS-1-XY") === "1XY", "short order numbers should stay compact");

assert(isIfthenpayGatewayAccepted("000"), "MB WAY create Status 000 must be accepted");
assert(isIfthenpayGatewayAccepted("0"), "Multibanco create Status 0 must be accepted");
assert(isIfthenpayGatewayAccepted(""), "missing gateway status + HTTP 200 is accepted");
assert(!isIfthenpayGatewayAccepted("101"), "gateway error status must be rejected");

assert(isPaidCallbackStatus(null), "Ifthenpay success callbacks may omit status");
assert(isPaidCallbackStatus("PAGO"), "classic MB WAY estado=PAGO is paid");
assert(isPaidCallbackStatus("000"), "Status 000 on callback is paid");
assert(!isPaidCallbackStatus("expired"), "non-success callback status must fail");

assert(parseIfthenpayAmountCents({ amount: "12.50" }) === 1250, "decimal euros");
assert(parseIfthenpayAmountCents({ valor: "12,50" }) === 1250, "comma euros");
assert(parseIfthenpayAmountCents({ Amount: 12.5 }) === 1250, "numeric euros");

const spg = {
  key: "anti-phish",
  orderId: orderId,
  amount: "12.50",
  requestId: "req-1",
  reference: "000000291",
};
assert(extractIfthenpaySecret(spg) === "anti-phish", "secret from key=");
assert(extractIfthenpayReference(spg) === orderId, "prefer orderId over Multibanco reference");
assert(extractIfthenpayStatus(spg) === null, "SPG callback has no status");

const classicMbway = {
  chave: "anti-phish",
  referencia: "JSSREF",
  idpedido: "i2szvoUfPYBMWdSxqO3n",
  valor: "10.00",
  estado: "PAGO",
};
assert(extractIfthenpaySecret(classicMbway) === "anti-phish", "secret from chave=");
assert(extractIfthenpayReference(classicMbway) === "i2szvoUfPYBMWdSxqO3n", "prefer idpedido");
assert(extractIfthenpayStatus(classicMbway) === "PAGO", "classic estado");

const classicMb = { chave: "anti-phish", referencia: "000 000 291", valor: "12.50" };
assert(extractIfthenpayReference(classicMb) === "000 000 291", "classic Multibanco uses referencia");
assert(normalizePaymentReference(extractIfthenpayReference(classicMb)) === "000000291", "lookup strips spaces");

assert(normalizePaymentReference("000 000 291") === "000000291", "strip MB spaces");

const urls = ifthenpayCallbackUrlTemplates();
assert(urls.mbway.includes("/api/payments/ifthenpay/callback"), "callback path");
assert(urls.mbway.includes("key=[ANTI_PHISHING_KEY]"), "anti-phishing placeholder");
assert(urls.multibanco.includes("reference=[REFERENCE]"), "MB reference placeholder");

console.log("ifthenpay helpers OK:", { orderNumber, orderId, urls });
