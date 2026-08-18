import { cookies } from "next/headers";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { CART_COOKIE, getActiveCart, summarizeCart } from "@/lib/ecommerce/cart";
import { validateCoupon } from "@/lib/ecommerce/coupons";
import { couponValidationSchema } from "@/lib/ecommerce/schemas";
import { readSessionUser } from "@/lib/ecommerce/session";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "coupon-validate", 30, 60_000);
  if (limited) return limited;

  try {
    const payload = couponValidationSchema.parse(await readJson(request));
    const session = await readSessionUser();
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(CART_COOKIE)?.value;
    const cart = await getActiveCart({ userId: session?.id, guestToken });
    const summary = summarizeCart(cart);
    const coupon = await validateCoupon(payload.code, summary.subtotalCents, {
      userId: session?.id,
      email: session?.email,
    });

    return Response.json({
      coupon,
      subtotalCents: summary.subtotalCents,
      discountCents: coupon?.discountCents || 0,
      totalAfterDiscountCents: Math.max(0, summary.subtotalCents - (coupon?.discountCents || 0)),
    });
  } catch (error) {
    return apiError(error);
  }
}
