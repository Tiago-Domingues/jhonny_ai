import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { unavailableError } from "@/lib/ecommerce/api";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
  buildGoogleAuthorizeUrl,
  createOAuthState,
  getGoogleOAuthConfig,
  googleCallbackUrl,
  hashOAuthState,
  isGoogleOAuthConfigured,
  resolveRequestOrigin,
} from "@/lib/ecommerce/googleOAuth";
import { enforceRateLimit, isProductionRuntime } from "@/lib/ecommerce/securityRuntime";

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/conta?error=google_not_configured", resolveRequestOrigin(request)));
  }

  const limited = enforceRateLimit(request, "auth-google-start", 20, 60_000);
  if (limited) return limited;

  try {
    const { clientId } = getGoogleOAuthConfig();
    const origin = resolveRequestOrigin(request);
    const redirectUri = googleCallbackUrl(origin);
    const state = createOAuthState();
    const authorizeUrl = buildGoogleAuthorizeUrl({ clientId, redirectUri, state });

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, hashOAuthState(state), {
      httpOnly: true,
      sameSite: "lax",
      secure: isProductionRuntime(),
      maxAge: GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/conta?error=google_auth_failed", resolveRequestOrigin(request)));
  }
}
