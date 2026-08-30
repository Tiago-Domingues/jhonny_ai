import {
  buildVerifyEmailUrl,
  isAllowedCheckoutOrigin,
  originFromRequest,
  resolveCheckoutOrigin,
  stripeLineItems,
  stripeLineItemsTotalCents,
  stripePaidAmountCents,
  stripeSessionIsPaid,
  stripePaymentMethodTypes,
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
assert(stripePaymentMethodTypes("KLARNA")?.join() === "klarna", "Klarna must not include card");
assert(stripePaymentMethodTypes("REVOLUT_PAY")?.join() === "revolut_pay", "Revolut Pay must not include card");
assert(stripePaymentMethodTypes("GOOGLE_PAY")?.join() === "card", "Google Pay uses Stripe card wallets");
assert(stripePaymentMethodTypes("APPLE_PAY")?.join() === "card", "Apple Pay uses Stripe card wallets");
assert(stripePaymentMethodTypes("CARD")?.join() === "card", "card checkout uses Stripe");
assert(stripePaymentMethodTypes("PAYPAL")?.join() === "paypal", "PayPal uses Stripe Checkout");
assert(stripePaymentMethodTypes("PIX")?.join() === "pix", "Pix uses Stripe Checkout");

assert(
  buildVerifyEmailUrl("tok_abc", "https://www.jhonnysurfstore.pt") ===
    "https://www.jhonnysurfstore.pt/conta/verificar-email?token=tok_abc",
  "verify URL uses the request origin"
);
assert(
  buildVerifyEmailUrl("tok+plus", "https://www.jhonnysurfstore.com").includes("tok%2Bplus"),
  "verify URL encodes the token"
);
assert(
  !buildVerifyEmailUrl("tok_abc", "https://evil.example").includes("evil.example"),
  "unknown origin must not be written into the verify email"
);
assert(
  originFromRequest({
    headers: new Headers({ origin: "https://www.jhonnysurfstore.pt" }),
    url: "https://www.jhonnysurfstore.com/api/auth/register",
  }) === "https://www.jhonnysurfstore.pt",
  "register origin prefers the browser Origin header"
);

console.log("stripe checkout helpers ok");
