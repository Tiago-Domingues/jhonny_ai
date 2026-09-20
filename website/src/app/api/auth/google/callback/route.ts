import { NextRequest, NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { unavailableError } from "@/lib/ecommerce/api";
import { upsertGoogleCustomer } from "@/lib/ecommerce/auth";
import { CART_COOKIE, mergeGuestCartIntoUser } from "@/lib/ecommerce/cart";
import { sendWelcomeNotificationsIfProfileReady } from "@/lib/ecommerce/welcomeNotifications";
import { ensureAdminRoleForEmail } from "@/lib/ecommerce/admin";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  getGoogleOAuthConfig,
  oauthStateCookieMatches,
  parseSignedOAuthState,
  resolveRequestOrigin,
  isGoogleOAuthConfigured,
} from "@/lib/ecommerce/googleOAuth";
import { createSessionToken, setSessionCookie } from "@/lib/ecommerce/session";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

export const dynamic = "force-dynamic";

function redirectToConta(request: Request, error?: string) {
  const origin = resolveRequestOrigin(request);
  const url = new URL("/conta", origin);
  if (error) url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
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

  const parsed = parseSignedOAuthState(state);
  const expectedHash = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  if (!parsed || !oauthStateCookieMatches(expectedHash, state)) {
    console.error("google_oauth_state_invalid", {
      hasCookie: Boolean(expectedHash),
      hasSignedState: Boolean(parsed),
    });
    return redirectToConta(request, "google_auth_failed");
  }

  try {
    const { clientId, clientSecret } = getGoogleOAuthConfig();
    const accessToken = await exchangeGoogleCode({
      code,
      redirectUri: parsed.redirectUri,
      clientId,
      clientSecret,
    });
    const info = await fetchGoogleUserInfo(accessToken);
    const { user, created } = await upsertGoogleCustomer(info);
    await ensureAdminRoleForEmail(user.id, user.email);

    if (created) {
      await sendWelcomeNotificationsIfProfileReady({
        userId: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
        phoneCountryCode: user.profile?.phoneCountryCode,
        phone: user.profile?.phone,
        addressLine1: user.profile?.addressLine1,
        city: user.profile?.city,
        postalCode: user.profile?.postalCode,
      }).catch((error) => {
        console.error("google_oauth_welcome_failed", error instanceof Error ? error.message : error);
      });
    }

    const guestToken = request.cookies.get(CART_COOKIE)?.value;
    await mergeGuestCartIntoUser(guestToken, user.id).catch((error) => {
      console.error("google_oauth_cart_merge_failed", error instanceof Error ? error.message : error);
    });

    const token = await createSessionToken(user.id);
    const response = redirectToConta(request);
    setSessionCookie(response, token);
    response.cookies.delete(CART_COOKIE);
    return response;
  } catch (error) {
    console.error("google_oauth_callback_failed", error instanceof Error ? error.message : error);
    return redirectToConta(request, "google_auth_failed");
  }
}
