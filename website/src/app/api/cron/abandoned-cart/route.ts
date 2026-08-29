import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { processAbandonedCartReminders } from "@/lib/ecommerce/abandonedCart";
import { hasValidOpsBearer, isProductionRuntime, readOpsSecret } from "@/lib/ecommerce/securityRuntime";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = readOpsSecret();
  if (!expected) {
    return !isProductionRuntime();
  }
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
    return Response.json(
      { error: "database_unavailable", message: "DATABASE_URL is not configured." },
      { status: 503 }
    );
  }

  try {
    const started = Date.now();
    const result = await processAbandonedCartReminders();
    return Response.json({ ...result, durationMs: Date.now() - started });
  } catch (error) {
    return Response.json(
      {
        error: "abandoned_cart_failed",
        message: error instanceof Error ? error.message : "Abandoned-cart cron failed.",
      },
      { status: 503 }
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
