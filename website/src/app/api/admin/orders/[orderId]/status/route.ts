import { prisma, hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { orderStatusSchema } from "@/lib/ecommerce/schemas";
import { readSessionUser } from "@/lib/ecommerce/session";
import { scheduleReviewRequest } from "@/lib/ecommerce/email";
import { cancelUnpaidOrder } from "@/lib/ecommerce/inventory";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  if (!hasDatabaseUrl()) return unavailableError();

  const session = await readSessionUser();
  if (!session || session.role !== "ADMIN") {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await context.params;
    const { status } = orderStatusSchema.parse(await readJson(request));

    if (status === "CANCELLED") {
      const cancelled = await cancelUnpaidOrder(orderId, "admin_cancelled");
      if (cancelled.cancelled) {
        const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
        return Response.json({ order, stockReleased: true });
      }
      // Paid / already closed: still allow status write without releasing stock again.
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        completedAt: status === "DELIVERED" ? new Date() : undefined,
      },
    });

    if (status === "DELIVERED" || status === "READY_FOR_PICKUP") {
      await scheduleReviewRequest(order.id);
    }

    return Response.json({ order });
  } catch (error) {
    return apiError(error);
  }
}
