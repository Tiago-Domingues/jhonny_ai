import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import { unavailableError } from "@/lib/ecommerce/api";
import { isPaidPlusStatus } from "@/lib/ecommerce/orderKpis";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "checkout-thanks", 40, 60_000);
  if (limited) return limited;

  const orderId = new URL(request.url).searchParams.get("orderId")?.trim() || "";
  if (orderId.length < 8) {
    return Response.json({ error: "invalid_order" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      status: true,
      totalCents: true,
      paidAt: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, amountCents: true },
      },
    },
  });
  if (!order) {
    return Response.json({ error: "order_not_found" }, { status: 404 });
  }

  const payment = order.payments[0];
  const paid = Boolean(order.paidAt) || isPaidPlusStatus(order.status) || payment?.status === "PAID";
  return Response.json({
    paid,
    orderNumber: order.orderNumber,
    amountCents: payment?.amountCents || order.totalCents,
    status: order.status,
  });
}
