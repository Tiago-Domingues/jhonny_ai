import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { requireAdminSession } from "@/lib/ecommerce/admin";
import { getAnalyticsSummary } from "@/lib/ecommerce/analytics";

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const days = Number(new URL(request.url).searchParams.get("days") || 30);
    const summary = await getAnalyticsSummary(Number.isFinite(days) ? days : 30);
    return NextResponse.json(summary);
  } catch (error) {
    return apiError(error);
  }
}
