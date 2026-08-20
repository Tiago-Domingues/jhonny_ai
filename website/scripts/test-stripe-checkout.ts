import {
  isAllowedCheckoutOrigin,
  resolveCheckoutOrigin,
  stripeLineItems,
  stripeLineItemsTotalCents,
  stripePaidAmountCents,
  stripeSessionIsPaid,
} from "../src/lib/ecommerce/stripeCheckout";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const lines = stripeLineItems({
  items: [
    { name: "Wetsuit", quantity: 1, totalCents: 12000 },
    { name: "Wax", quantity: 2, totalCents: 1600 },
  ],
  shippingCents: 500,
  discountCents: 1360,
  currency: "EUR",
});

assert(stripeLineItemsTotalCents(lines) === 12000 + 1600 + 500 - 1360, "line items must equal order total");
assert(lines.some((line) => line.price_data.product_data.name === "Portes"), "shipping line should exist");
assert(isAllowedCheckoutOrigin("https://www.jhonnysurfstore.com"), ".com origin should be allowed");
assert(isAllowedCheckoutOrigin("https://jhonnysurfstore.pt"), ".pt origin should be allowed");
assert(isAllowedCheckoutOrigin("http://localhost:3000"), "localhost origin should be allowed");
assert(!isAllowedCheckoutOrigin("https://evil.example"), "unknown origin should be rejected");
assert(
  resolveCheckoutOrigin("https://evil.example", "https://www.jhonnysurfstore.com") ===
    "https://www.jhonnysurfstore.com",
  "unsafe origin must fall back"
);
assert(stripeSessionIsPaid({ payment_status: "paid" }), "paid session should count as paid");
assert(!stripeSessionIsPaid({ payment_status: "unpaid" }), "unpaid session should not count as paid");
assert(stripePaidAmountCents({ amount_total: 10850 }) === 10850, "amount_total is already cents");

console.log("stripe checkout helpers ok");
