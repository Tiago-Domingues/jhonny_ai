import { cookies } from "next/headers";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { CART_COOKIE } from "@/lib/ecommerce/cart";
import { createCheckout } from "@/lib/ecommerce/checkout";
import { assertSessionSecretConfigured, readSessionUser } from "@/lib/ecommerce/session";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "checkout", 20, 60_000);
  if (limited) return limited;

  try {
    assertSessionSecretConfigured();
    const session = await readSessionUser();
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(CART_COOKIE)?.value;
    const result = await createCheckout(
      { userId: session?.id, guestToken },
      await readJson(request)
    );
    return Response.json({
      order: result.order,
      payment: result.payment,
    });
  } catch (error) {
    return apiError(error);
  }
}
