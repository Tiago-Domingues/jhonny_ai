import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { startPendingRegistration } from "@/lib/ecommerce/emailVerification";
import { mergeGuestCartIntoUser, CART_COOKIE } from "@/lib/ecommerce/cart";
import { createSessionToken, setSessionCookie } from "@/lib/ecommerce/session";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";
import { originFromRequest } from "@/lib/ecommerce/stripeCheckout";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "auth-register", 8, 60_000);
  if (limited) return limited;

  try {
    const result = await startPendingRegistration(await readJson(request), originFromRequest(request));
    if (result.pending) {
      return NextResponse.json({ pending: true, emailSent: true });
    }

    const cookieStore = await cookies();
    const guestToken = cookieStore.get(CART_COOKIE)?.value;
    await mergeGuestCartIntoUser(guestToken, result.user.id);

    const token = await createSessionToken(result.user.id);
    const response = NextResponse.json({
      pending: false,
      emailSent: false,
      created: result.created,
      user: result.user,
    });
    setSessionCookie(response, token);
    response.cookies.delete(CART_COOKIE);
    return response;
  } catch (error) {
    return apiError(error);
  }
}
