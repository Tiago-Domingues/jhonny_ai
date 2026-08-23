import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { listOrdersForUser } from "@/lib/ecommerce/orders";
import { readSessionUser } from "@/lib/ecommerce/session";

export async function GET() {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await readSessionUser();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const orders = await listOrdersForUser(session.id, session.email);
    return NextResponse.json({ orders });
  } catch (error) {
    return apiError(error);
  }
}
