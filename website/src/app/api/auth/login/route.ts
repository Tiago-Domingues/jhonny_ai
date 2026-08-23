import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { loginCustomer } from "@/lib/ecommerce/auth";
import { mergeGuestCartIntoUser, CART_COOKIE } from "@/lib/ecommerce/cart";
import { remindPendingRegistration, requestEmailVerification } from "@/lib/ecommerce/emailVerification";
import { createSessionToken, setSessionCookie } from "@/lib/ecommerce/session";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const UNVERIFIED_MESSAGE = "Confirm your email first. We sent a new link.";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "auth-login", 10, 60_000);
  if (limited) return limited;

  try {
    const payload = (await readJson(request)) as { emailOrUsername?: string; password?: string };
    try {
      const user = await loginCustomer(payload);
      if (!user.emailVerifiedAt) {
        await requestEmailVerification(user.id).catch(() => null);
        return NextResponse.json({ error: "email_unverified", message: UNVERIFIED_MESSAGE }, { status: 403 });
      }

      const cookieStore = await cookies();
      const guestToken = cookieStore.get(CART_COOKIE)?.value;
      await mergeGuestCartIntoUser(guestToken, user.id);

      const token = await createSessionToken(user.id);
      const response = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.profile?.fullName,
          emailVerifiedAt: user.emailVerifiedAt,
        },
      });
      setSessionCookie(response, token);
      response.cookies.delete(CART_COOKIE);
      return response;
    } catch (error) {
      const identifier = typeof payload?.emailOrUsername === "string" ? payload.emailOrUsername : "";
      if (identifier.includes("@") && (await remindPendingRegistration(identifier))) {
        return NextResponse.json({ error: "email_unverified", message: UNVERIFIED_MESSAGE }, { status: 403 });
      }
      return apiError(error, 401);
    }
  } catch (error) {
    return apiError(error, 401);
  }
}
