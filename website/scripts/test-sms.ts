import {
  SMS_MAX_CHARS,
  customerPaidSmsBody,
  formatPaidAtLisbon,
  jhonnySmsPhone,
  ownerPaidSmsBody,
  truncateSms,
} from "../src/lib/ecommerce/smsMessages";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const paidAt = new Date("2026-08-21T12:00:00.000Z");
const customerItems = [
  { name: "Wetsuit", quantity: 1, totalCents: 12000 },
  { name: "Wax", quantity: 2, totalCents: 990 },
];
const customer = customerPaidSmsBody({
  orderNumber: "JSS-1042",
  totalCents: 12990,
  paidAt,
  paymentMethod: "MBWAY",
  items: customerItems,
});
assert(customer.includes("pagamento confirmado"), "customer SMS must mention payment confirmation");
assert(customer.includes("Encomenda JSS-1042"), "customer SMS must include the order number");
assert(customer.includes("Obrigado!"), "customer SMS must thank the customer");
assert(customer.includes("129,90"), "customer SMS must include the formatted total");
assert(customer.includes("1x Wetsuit"), "customer SMS must list items");
assert(customer.includes("2x Wax"), "customer SMS must list the second item");
assert(customer.includes("MB WAY"), "customer SMS must include the payment method");
assert(!customer.includes("Nome:"), "customer SMS must not repeat the customer name");
assert(!customer.includes("Nova venda"), "customer SMS must not use the owner sale heading");

const lisbon = formatPaidAtLisbon(paidAt);
assert(lisbon.includes("21"), "Lisbon date must include the day");
assert(lisbon.includes("08") || lisbon.includes("8"), "Lisbon date must include August");
assert(lisbon.includes("2026"), "Lisbon date must include the year");
assert(lisbon.includes("13"), "12:00 UTC in August is 13:00 in Europe/Lisbon");

const owner = ownerPaidSmsBody({
  orderNumber: "JSS-1042",
  customerName: "Ana Silva",
  customerPhone: "+351912345678",
  totalCents: 12990,
  paidAt,
  paymentMethod: "MBWAY",
  items: [
    { name: "Wetsuit", quantity: 1, totalCents: 12000 },
    { name: "Wax", quantity: 2, totalCents: 990 },
  ],
});
assert(owner.includes("Nova venda"), "owner SMS must start with a sale alert");
assert(owner.includes("Encomenda JSS-1042"), "owner SMS must include the order number");
assert(owner.includes("Nome: Ana Silva"), "owner SMS must include the customer name");
assert(owner.includes("Tel: +351912345678"), "owner SMS must include the customer phone");
assert(owner.includes("1x Wetsuit"), "owner SMS must list the first item");
assert(owner.includes("2x Wax"), "owner SMS must list the second item");
assert(owner.includes("129,90"), "owner SMS must include the formatted total");
assert(owner.includes("MB WAY"), "owner SMS must include the payment method label");
assert(owner.length <= SMS_MAX_CHARS, "owner SMS must stay within Twilio-safe length");

const truncated = truncateSms("a".repeat(SMS_MAX_CHARS + 50));
assert(truncated.length === SMS_MAX_CHARS, "truncateSms must cap at SMS_MAX_CHARS");
assert(truncated.endsWith("…"), "truncated SMS must end with an ellipsis");
assert(truncateSms("short") === "short", "short SMS must be left unchanged");

const longOwner = ownerPaidSmsBody({
  orderNumber: "JSS-9999",
  customerName: "Cliente",
  totalCents: 100,
  paidAt,
  paymentMethod: "CARD",
  items: Array.from({ length: 80 }, (_, index) => ({
    name: `Produto muito comprido número ${index + 1} para forçar truncagem`,
    quantity: 3,
    totalCents: 1999,
  })),
});
assert(longOwner.length <= SMS_MAX_CHARS, "long owner SMS must be truncated to SMS_MAX_CHARS");
assert(longOwner.endsWith("…"), "long owner SMS must end with an ellipsis");

const longCustomer = customerPaidSmsBody({
  orderNumber: "JSS-9999",
  totalCents: 100,
  paidAt,
  paymentMethod: "CARD",
  items: Array.from({ length: 80 }, (_, index) => ({
    name: `Produto muito comprido número ${index + 1} para forçar truncagem`,
    quantity: 3,
    totalCents: 1999,
  })),
});
assert(longCustomer.length <= SMS_MAX_CHARS, "long customer SMS must be truncated to SMS_MAX_CHARS");
assert(longCustomer.endsWith("…"), "long customer SMS must end with an ellipsis");
assert(longCustomer.includes("pagamento confirmado"), "truncated customer SMS keeps the intro");

const previousJhonny = process.env.JHONNY_SMS_PHONE;
process.env.JHONNY_SMS_PHONE = " +351910000000 ";
assert(jhonnySmsPhone() === "+351910000000", "JHONNY_SMS_PHONE must be trimmed");
process.env.JHONNY_SMS_PHONE = "";
assert(jhonnySmsPhone() === "", "empty JHONNY_SMS_PHONE must skip owner SMS");
if (previousJhonny === undefined) {
  delete process.env.JHONNY_SMS_PHONE;
} else {
  process.env.JHONNY_SMS_PHONE = previousJhonny;
}

console.log("paid-order SMS helpers ok");
