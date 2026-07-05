import { syncOdooProducts } from "@/lib/ecommerce/odooCatalog";
import { hasOdooConfig } from "@/lib/ecommerce/odooClient";

export async function POST() {
  if (!hasOdooConfig()) {
    return Response.json(
      {
        error: "odoo_not_configured",
        message: "Add ODOO_URL, ODOO_DB, ODOO_USERNAME, and ODOO_API_KEY before syncing products.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await syncOdooProducts();
    return Response.json(result);
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
