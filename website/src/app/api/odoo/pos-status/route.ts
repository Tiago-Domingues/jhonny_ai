import { hasOdooConfig, OdooClient } from "@/lib/ecommerce/odooClient";
import { diagnosePos } from "@/lib/ecommerce/odooPos";
import { hasValidOpsBearer, isProductionRuntime, readOpsSecret } from "@/lib/ecommerce/securityRuntime";
import { readSessionUser } from "@/lib/ecommerce/session";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = readOpsSecret();
  if (expected && hasValidOpsBearer(request)) return true;
  return false;
}

export async function GET(request: Request) {
  const session = await readSessionUser().catch(() => null);
  if (!authorized(request) && session?.role !== "ADMIN") {
    if (isProductionRuntime() || readOpsSecret()) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!hasOdooConfig()) {
    return Response.json({ configured: false }, { status: 503 });
  }

  try {
    const diagnosis = await diagnosePos(new OdooClient());
    return Response.json({ configured: true, ok: true, ...diagnosis });
  } catch (error) {
    return Response.json(
      {
        configured: true,
        ok: false,
        message: error instanceof Error ? error.message : "pos_status_failed",
      },
      { status: 503 }
    );
  }
}
