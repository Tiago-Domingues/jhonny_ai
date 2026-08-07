import { revalidatePath } from "next/cache";
import { revalidateCatalogCache } from "@/lib/ecommerce/catalog";
import { syncOdooProducts } from "@/lib/ecommerce/odooCatalog";
import { hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { hasValidOpsBearer, isProductionRuntime, readOpsSecret } from "@/lib/ecommerce/securityRuntime";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = readOpsSecret();
  if (!expected) {
    // Fail closed in production if no cron/sync secret is configured.
    return !isProductionRuntime();
  }
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
        message: "Add ODOO_URL, ODOO_DB, ODOO_USERNAME, and ODOO_API_KEY before syncing products.",
      },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const modeParam = url.searchParams.get("mode");
  const mode = modeParam === "full" ? "full" : "incremental";

  try {
    const started = Date.now();
    const result = await syncOdooProducts({ mode });
    revalidateCatalogCache();
    revalidatePath("/");
    revalidatePath("/loja");
    revalidatePath("/api/products");
    return Response.json({
      ...result,
      durationMs: Date.now() - started,
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        error: "odoo_sync_failed",
        message: error instanceof Error ? error.message : "Odoo product sync failed.",
      },
      { status: 503 }
    );
  }
}

/** Vercel Cron uses GET by default. */
export async function GET(request: Request) {
  return runSync(request);
}

export async function POST(request: Request) {
  return runSync(request);
}
