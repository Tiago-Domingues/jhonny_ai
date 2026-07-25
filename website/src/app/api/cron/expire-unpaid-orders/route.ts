import { expireUnpaidOrders } from "@/lib/ecommerce/inventory";
import { hasValidOpsBearer, isProductionRuntime, readOpsSecret } from "@/lib/ecommerce/securityRuntime";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = readOpsSecret();
  if (!expected) return !isProductionRuntime();
  return hasValidOpsBearer(request);
}

async function run(request: Request) {
  if (!authorized(request)) {
    return Response.json(
      {
        error: "unauthorized",
        message: "Missing or invalid cron secret (CRON_SECRET / ODOO_SYNC_SECRET).",
      },
      { status: 401 }
    );
  }
  if (!hasDatabaseUrl()) {
    return Response.json({ error: "database_not_configured" }, { status: 503 });
  }

  try {
    const result = await expireUnpaidOrders(100);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      {
        error: "expire_failed",
        message: error instanceof Error ? error.message : "Failed to expire unpaid orders.",
      },
      { status: 500 }
    );
  }
}

/** Vercel Cron uses GET by default. */
export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
