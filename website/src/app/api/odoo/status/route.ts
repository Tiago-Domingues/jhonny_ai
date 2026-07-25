import { OdooClient, hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { readSessionUser } from "@/lib/ecommerce/session";
import { hasValidOpsBearer } from "@/lib/ecommerce/securityRuntime";

export async function GET(request: Request) {
  const session = await readSessionUser().catch(() => null);
  const allowed = session?.role === "ADMIN" || hasValidOpsBearer(request);
  if (!allowed) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasOdooConfig()) {
    return Response.json({
      configured: false,
      authenticated: false,
      message: "Odoo credentials are not configured.",
    });
  }

  try {
    const uid = await new OdooClient().authenticate();
    return Response.json({ configured: true, authenticated: true, uid });
  } catch (error) {
    return Response.json(
      {
        configured: true,
        authenticated: false,
        message: error instanceof Error ? error.message : "Odoo authentication failed.",
      },
      { status: 503 }
    );
  }
}
