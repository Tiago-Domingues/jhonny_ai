import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { unavailableError } from "@/lib/ecommerce/api";
import { requireAdminSession } from "@/lib/ecommerce/admin";
import { listCustomersForAdmin } from "@/lib/ecommerce/customers";

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || undefined;
  const auth = (url.searchParams.get("auth") || "all") as "all" | "google" | "password";
  const marketing = (url.searchParams.get("marketing") || "all") as "all" | "yes" | "no";
  const limit = Number(url.searchParams.get("limit") || 50);
  const offset = Number(url.searchParams.get("offset") || 0);

  const data = await listCustomersForAdmin({ q, auth, marketing, limit, offset });
  return NextResponse.json(data);
}
