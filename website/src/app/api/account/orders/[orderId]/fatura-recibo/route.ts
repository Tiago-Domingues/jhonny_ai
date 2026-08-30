import { NextResponse } from "next/server";
import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { orderBelongsToUser } from "@/lib/ecommerce/orderAccess";
import { streamFaturaRecibo } from "@/lib/ecommerce/faturaRecibo";
import { readSessionUser } from "@/lib/ecommerce/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await readSessionUser();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, odooInvoiceId: true, userId: true, customerEmail: true },
    });
    if (!order || !orderBelongsToUser(order, session.id, session.email)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return streamFaturaRecibo(order);
  } catch (error) {
    return apiError(error);
  }
}
