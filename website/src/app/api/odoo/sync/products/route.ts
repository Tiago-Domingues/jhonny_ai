import { revalidatePath } from "next/cache";
import { syncOdooProducts } from "@/lib/ecommerce/odooCatalog";
import { hasOdooConfig } from "@/lib/ecommerce/odooClient";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const syncSecret = process.env.ODOO_SYNC_SECRET?.trim();
  const expected = cronSecret || syncSecret;
  // Fail closed in production when a secret is configured; allow local/dev without.
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  const alt = request.headers.get("x-odoo-sync-secret")?.trim() || "";
  return bearer === expected || alt === expected;
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
