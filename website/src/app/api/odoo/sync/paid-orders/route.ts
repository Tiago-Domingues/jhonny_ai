import { findOrderForPaidEmail, findPaidOrdersMissingFaturaEmail, sendPaymentConfirmedEmails } from "@/lib/ecommerce/email";
import { hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { syncPaidOrdersMissingOdooInvoices } from "@/lib/ecommerce/odooOrders";
import { hasValidOpsBearer, isProductionRuntime, readOpsSecret } from "@/lib/ecommerce/securityRuntime";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = readOpsSecret();
  if (!expected) return !isProductionRuntime();
  return hasValidOpsBearer(request);
}

async function runSync(request: Request) {
  if (!authorized(request)) {
    return Response.json(
      {
        error: "unauthorized",
        message: "Missing or invalid sync secret (CRON_SECRET / ODOO_SYNC_SECRET).",
      },
      { status: 401 }
    );
  }

  if (!hasOdooConfig()) {
    return Response.json(
      {
        error: "odoo_not_configured",
        message: "Add ODOO_URL, ODOO_DB, ODOO_USERNAME, and ODOO_API_KEY before invoicing paid orders.",
      },
      { status: 503 }
    );
  }

  const started = Date.now();
  const forceOrderNumber = new URL(request.url).searchParams.get("forceOrder")?.trim() || "";
  const result = await syncPaidOrdersMissingOdooInvoices(20);
  const pendingEmail = new Map(result.invoiced.map((order) => [order.orderId, order.orderNumber]));
  const missingEmail = await findPaidOrdersMissingFaturaEmail(20);
  for (const order of missingEmail) {
    pendingEmail.set(order.id, order.orderNumber);
  }

  const forceIds = new Set<string>();
  let forceOrder: { orderNumber: string; found: boolean } | null = null;
  if (forceOrderNumber) {
    const order = await findOrderForPaidEmail(forceOrderNumber);
    forceOrder = { orderNumber: forceOrderNumber, found: Boolean(order) };
    if (!order) {
      return Response.json(
        {
          ...result,
          forceOrder,
          emailed: [],
          durationMs: Date.now() - started,
          error: "order_not_found",
          ok: false,
        },
        { status: 404 }
      );
    }
    pendingEmail.set(order.id, order.orderNumber);
    forceIds.add(order.id);
  }

  const emailed: string[] = [];
  for (const [orderId, orderNumber] of pendingEmail) {
    try {
      const sent = await sendPaymentConfirmedEmails(orderId, { force: forceIds.has(orderId) });
      if (!sent?.skipped) emailed.push(orderNumber);
    } catch {
      // Invoice exists in Odoo even if the follow-up email fails.
    }
  }

  return Response.json({
    ...result,
    forceOrder,
    emailed,
    durationMs: Date.now() - started,
    ok: true,
  });
}

export async function GET(request: Request) {
  return runSync(request);
}

export async function POST(request: Request) {
  return runSync(request);
}
