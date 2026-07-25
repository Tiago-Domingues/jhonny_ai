import { integrationStatus } from "@/lib/ecommerce/integrations";
import { readSessionUser } from "@/lib/ecommerce/session";
import { hasValidOpsBearer } from "@/lib/ecommerce/securityRuntime";

export async function GET(request: Request) {
  const session = await readSessionUser().catch(() => null);
  const allowed = session?.role === "ADMIN" || hasValidOpsBearer(request);
  if (!allowed) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json(integrationStatus());
}
