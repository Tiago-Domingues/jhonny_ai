import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { requireAdminSession } from "@/lib/ecommerce/admin";
import { listOrdersForCustomerAdmin } from "@/lib/ecommerce/orders";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await context.params;
    const orders = await listOrdersForCustomerAdmin(userId);
    if (!orders) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ orders });
  } catch (error) {
    return apiError(error);
  }
}
