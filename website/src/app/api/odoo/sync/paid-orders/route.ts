import { sendPaymentConfirmedEmails } from "@/lib/ecommerce/email";
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
  const result = await syncPaidOrdersMissingOdooInvoices(20);
  const emailed: string[] = [];
  for (const order of result.invoiced) {
    try {
      await sendPaymentConfirmedEmails(order.orderId);
      emailed.push(order.orderNumber);
    } catch {
      // Invoice exists in Odoo even if the follow-up email fails.
    }
  }

  return Response.json({
    ...result,
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
