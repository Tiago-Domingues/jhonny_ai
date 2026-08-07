import { z } from "zod";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { lookupOrderByEmailAndNumber } from "@/lib/ecommerce/orders";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

const lookupSchema = z.object({
  email: z.string().email(),
  orderNumber: z.string().min(4).max(40),
});

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "order-lookup", 15, 60_000);
  if (limited) return limited;

  try {
    const data = lookupSchema.parse(await readJson(request));
    const order = await lookupOrderByEmailAndNumber(data.email, data.orderNumber);
    if (!order) {
      return Response.json(
        { error: "not_found", message: "No order found for that email and order number." },
        { status: 404 }
      );
    }
    return Response.json({ order });
  } catch (error) {
    return apiError(error);
  }
}
