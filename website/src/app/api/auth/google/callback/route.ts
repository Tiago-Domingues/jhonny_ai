import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { unavailableError } from "@/lib/ecommerce/api";
import { upsertGoogleCustomer } from "@/lib/ecommerce/auth";
import { CART_COOKIE, mergeGuestCartIntoUser } from "@/lib/ecommerce/cart";
import { sendWelcomeEmail } from "@/lib/ecommerce/email";
import { sendWelcomeSmsIfNeeded } from "@/lib/ecommerce/sms";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  getGoogleOAuthConfig,
  googleCallbackUrl,
  hashOAuthState,
  isGoogleOAuthConfigured,
  resolveRequestOrigin,
} from "@/lib/ecommerce/googleOAuth";
import { createSessionToken, setSessionCookie } from "@/lib/ecommerce/session";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

function redirectToConta(request: Request, error?: string) {
  const origin = resolveRequestOrigin(request);
  const url = new URL("/conta", origin);
  if (error) url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  if (!isGoogleOAuthConfigured()) {
    return redirectToConta(request, "google_not_configured");
  }

  const limited = enforceRateLimit(request, "auth-google-callback", 20, 60_000);
  if (limited) return limited;

  const url = new URL(request.url);
  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    return redirectToConta(request, "google_auth_denied");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirectToConta(request, "google_auth_failed");
  }

  const cookieStore = await cookies();
  const expectedHash = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  if (!expectedHash || expectedHash !== hashOAuthState(state)) {
    return redirectToConta(request, "google_auth_failed");
  }

  try {
    const { clientId, clientSecret } = getGoogleOAuthConfig();
    const origin = resolveRequestOrigin(request);
    const redirectUri = googleCallbackUrl(origin);
    const accessToken = await exchangeGoogleCode({
      code,
      redirectUri,
      clientId,
      clientSecret,
    });
    const info = await fetchGoogleUserInfo(accessToken);
    const { user, created } = await upsertGoogleCustomer(info);

    if (created) {
      try {
        await sendWelcomeEmail({
          userId: user.id,
          email: user.email,
          fullName: user.profile?.fullName,
        });
      } catch {
        // ignore hard failures
      }
      try {
        await sendWelcomeSmsIfNeeded({
          userId: user.id,
          fullName: user.profile?.fullName,
          phoneCountryCode: user.profile?.phoneCountryCode,
          phone: user.profile?.phone,
        });
      } catch {
        // ignore hard failures (Google signup often has no phone yet)
      }
    }

    const guestToken = cookieStore.get(CART_COOKIE)?.value;
    await mergeGuestCartIntoUser(guestToken, user.id);

    const token = await createSessionToken(user.id);
    const response = redirectToConta(request);
    setSessionCookie(response, token);
    response.cookies.delete(CART_COOKIE);
    return response;
  } catch {
    return redirectToConta(request, "google_auth_failed");
  }
}
