import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { listOrdersForAdmin } from "@/lib/ecommerce/orders";
import { readSessionUser } from "@/lib/ecommerce/session";

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();

  try {
    const session = await readSessionUser();
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") || "100");
    const orders = await listOrdersForAdmin(limit);
    return Response.json({ orders });
  } catch (error) {
    return apiError(error);
  }
}
