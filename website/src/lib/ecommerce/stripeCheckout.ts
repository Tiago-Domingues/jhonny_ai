/** Pure Stripe Checkout helpers (no Stripe SDK). Safe to unit-test. */

const ALLOWED_HOSTS = [
  "jhonnysurfstore.com",
  "www.jhonnysurfstore.com",
  "jhonnysurfstore.pt",
  "www.jhonnysurfstore.pt",
  "localhost",
  "127.0.0.1",
];

export function publicSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "https://www.jhonnysurfstore.com";
}

export function isAllowedCheckoutOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
    if (ALLOWED_HOSTS.includes(url.hostname)) return true;
    return url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function resolveCheckoutOrigin(candidate?: string | null, requestOrigin?: string | null) {
  for (const value of [candidate, requestOrigin]) {
    if (!value) continue;
    try {
      const origin = new URL(value).origin;
      if (isAllowedCheckoutOrigin(origin)) return origin;
    } catch {
      // try next candidate
    }
  }
  return publicSiteOrigin();
}

export type StripeOrderLine = {
  name: string;
  quantity: number;
  totalCents: number;
};

export function stripeLineItems(order: {
  items: StripeOrderLine[];
  shippingCents: number;
  discountCents: number;
  currency: string;
}) {
  const currency = (order.currency || "EUR").toLowerCase();
  const productTotal = order.items.reduce((sum, item) => sum + item.totalCents, 0);
  let leftoverDiscount = Math.max(0, order.discountCents);

  const lines = order.items.map((item, index) => {
    const isLast = index === order.items.length - 1;
    const share =
      productTotal <= 0 ? 0 : Math.round((item.totalCents / productTotal) * order.discountCents);
    const discount = isLast
      ? leftoverDiscount
      : Math.min(Math.max(0, share), leftoverDiscount, item.totalCents);
    leftoverDiscount -= discount;
    const amount = Math.max(0, item.totalCents - discount);
    const label = item.quantity > 1 ? `${item.quantity} × ${item.name}` : item.name;
    return {
      quantity: 1,
      price_data: {
        currency,
        unit_amount: amount,
        product_data: { name: label.slice(0, 250) },
      },
    };
  }).filter((line) => line.price_data.unit_amount > 0);

  if (order.shippingCents > 0) {
    lines.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: order.shippingCents,
        product_data: { name: "Portes" },
      },
    });
  }

  if (lines.length === 0) {
    lines.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: Math.max(order.items.reduce((sum, item) => sum + item.totalCents, 0) + order.shippingCents - order.discountCents, 50),
        product_data: { name: "Encomenda Jhonny Surf Store" },
      },
    });
  }

  return lines;
}

export function stripeLineItemsTotalCents(
  lines: ReturnType<typeof stripeLineItems>
) {
  return lines.reduce((sum, line) => sum + line.price_data.unit_amount * line.quantity, 0);
}

export function stripeSessionIsPaid(session: {
  payment_status?: string | null;
  status?: string | null;
}) {
  return session.payment_status === "paid" || session.payment_status === "no_payment_required";
}

export function stripePaidAmountCents(session: { amount_total?: number | null }) {
  if (session.amount_total == null || !Number.isFinite(session.amount_total)) return null;
  return Math.round(session.amount_total);
}

export function stripePaymentMethodTypes(
  method: string
): Array<"klarna" | "revolut_pay" | "card" | "paypal"> | null {
  if (method === "KLARNA") return ["klarna"];
  if (method === "REVOLUT_PAY") return ["revolut_pay"];
  if (method === "PAYPAL") return ["paypal"];
  // Cards, Apple Pay and Google Pay all use Stripe card Checkout (wallets appear when enabled).
  if (method === "CARD" || method === "GOOGLE_PAY" || method === "APPLE_PAY") return ["card"];
  return null;
}

export function hasStripeSecret() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
