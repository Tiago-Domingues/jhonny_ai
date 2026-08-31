import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { loginCustomer, toPublicAuthUser } from "@/lib/ecommerce/auth";
import { mergeGuestCartIntoUser, CART_COOKIE } from "@/lib/ecommerce/cart";
import { completePendingRegistrationWithPassword } from "@/lib/ecommerce/emailVerification";
import { createSessionToken, setSessionCookie } from "@/lib/ecommerce/session";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function sessionResponse(user: {
  id: string;
  email: string;
  username: string;
  emailVerifiedAt: Date | null;
  profile?: { fullName?: string | null } | null;
}) {
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(CART_COOKIE)?.value;
  await mergeGuestCartIntoUser(guestToken, user.id);

  const token = await createSessionToken(user.id);
  const response = NextResponse.json({ user: toPublicAuthUser(user) });
  setSessionCookie(response, token);
  response.cookies.delete(CART_COOKIE);
  return response;
}

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "auth-login", 10, 60_000);
  if (limited) return limited;

  try {
    const payload = (await readJson(request)) as { emailOrUsername?: string; password?: string };
    try {
      return sessionResponse(await loginCustomer(payload));
    } catch (error) {
      const completed = await completePendingRegistrationWithPassword(payload).catch(() => null);
      if (completed?.user) {
        return sessionResponse(completed.user);
      }
      return apiError(error, 401);
    }
  } catch (error) {
    return apiError(error, 401);
  }
}
