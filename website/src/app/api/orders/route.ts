import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { listOrdersForUser } from "@/lib/ecommerce/orders";
import { readSessionUser } from "@/lib/ecommerce/session";

export async function GET() {
  if (!hasDatabaseUrl()) return unavailableError();

  try {
    const session = await readSessionUser();
    if (!session) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const orders = await listOrdersForUser(session.id, session.email);
    return Response.json({ orders });
  } catch (error) {
    return apiError(error);
  }
}
