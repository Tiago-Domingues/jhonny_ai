import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { prisma } from "@/lib/ecommerce/db";
import { unavailableError } from "@/lib/ecommerce/api";
import { markPaymentPaid } from "@/lib/ecommerce/payments";
import { serializeOrderPublic } from "@/lib/ecommerce/orders";
import { getStripe } from "@/lib/ecommerce/stripe";
import { hasStripeSecret, stripePaidAmountCents, stripeSessionIsPaid } from "@/lib/ecommerce/stripeCheckout";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "stripe-session", 40, 60_000);
  if (limited) return limited;
  if (!hasStripeSecret()) {
    return Response.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() || "";
  if (!sessionId.startsWith("cs_")) {
    return Response.json({ error: "invalid_session" }, { status: 400 });
  }

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (stripeSessionIsPaid(session)) {
    try {
      await markPaymentPaid(session.id, {
        amountCents: stripePaidAmountCents(session),
        status: "paid",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "confirm_failed";
      if (message === "amount_mismatch" || message === "invalid_payment_status") {
        return Response.json({ error: message }, { status: 400 });
      }
    }
  }

  const payment = await prisma.payment.findFirst({
    where: { providerReference: session.id },
    include: {
      order: {
        include: {
          items: true,
          payments: { orderBy: { createdAt: "desc" as const }, take: 1 },
        },
      },
    },
  });
  if (!payment) {
    return Response.json({ error: "order_not_found" }, { status: 404 });
  }

  return Response.json({
    paymentStatus: session.payment_status,
    paid: stripeSessionIsPaid(session),
    order: serializeOrderPublic(payment.order),
  });
}
