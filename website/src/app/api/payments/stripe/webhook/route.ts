import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { unavailableError } from "@/lib/ecommerce/api";
import { markPaymentPaid } from "@/lib/ecommerce/payments";
import { getStripe, stripeWebhookSecret } from "@/lib/ecommerce/stripe";
import { stripePaidAmountCents, stripeSessionIsPaid } from "@/lib/ecommerce/stripeCheckout";
import { enforceRateLimit, isProductionRuntime } from "@/lib/ecommerce/securityRuntime";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function markStripeSessionPaid(session: Stripe.Checkout.Session) {
  const reference = session.id;
  if (!stripeSessionIsPaid(session) && session.payment_status !== "unpaid") {
    return 0;
  }
  if (!stripeSessionIsPaid(session)) return 0;
  return markPaymentPaid(reference, {
    amountCents: stripePaidAmountCents(session),
    status: "paid",
  });
}

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "stripe-webhook", 120, 60_000);
  if (limited) return limited;

  const secret = stripeWebhookSecret();
  if (isProductionRuntime() && !secret) {
    return Response.json(
      {
        error: "webhook_secret_not_configured",
        message: "STRIPE_WEBHOOK_SECRET must be set in production.",
      },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    if (!secret || !signature) {
      return Response.json({ error: "invalid_webhook_signature" }, { status: 401 });
    }
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ error: "invalid_webhook_signature" }, { status: 401 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const updated = await markStripeSessionPaid(session);
      return Response.json({ ok: true, updated });
    }
    if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const updated = await markPaymentPaid(session.id, {
        amountCents: stripePaidAmountCents(session),
        status: "paid",
      });
      return Response.json({ ok: true, updated });
    }
    return Response.json({ ok: true, ignored: event.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "webhook_failed";
    if (message === "amount_mismatch" || message === "invalid_payment_status") {
      return Response.json({ error: message }, { status: 400 });
    }
    return Response.json({ error: "webhook_failed", message }, { status: 500 });
  }
}
