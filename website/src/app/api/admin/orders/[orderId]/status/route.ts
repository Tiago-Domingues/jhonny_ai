import { prisma, hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { orderStatusSchema } from "@/lib/ecommerce/schemas";
import { readSessionUser } from "@/lib/ecommerce/session";
import { scheduleReviewRequest } from "@/lib/ecommerce/email";

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
