import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { requireAdminSession } from "@/lib/ecommerce/admin";
import { listOrdersForAdmin } from "@/lib/ecommerce/orders";

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const data = await listOrdersForAdmin({
      q: url.searchParams.get("q") || undefined,
      status: url.searchParams.get("status") || "all",
      limit: Number(url.searchParams.get("limit") || 100),
    });
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}
