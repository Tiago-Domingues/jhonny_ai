import { NextResponse } from "next/server";
import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { requireAdminSession } from "@/lib/ecommerce/admin";
import { streamFaturaRecibo } from "@/lib/ecommerce/faturaRecibo";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, odooInvoiceId: true },
    });
    if (!order) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return streamFaturaRecibo(order);
  } catch (error) {
    return apiError(error);
  }
}
