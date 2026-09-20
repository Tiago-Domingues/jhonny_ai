import { NextRequest, NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { unavailableError } from "@/lib/ecommerce/api";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  beginGoogleAuthorization,
  googleOAuthCookieOptions,
  isGoogleOAuthConfigured,
} from "@/lib/ecommerce/googleOAuth";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasDatabaseUrl()) return unavailableError();
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json({ error: "google_not_configured" }, { status: 503 });
  }

  const limited = enforceRateLimit(request, "auth-google-start", 20, 60_000);
  if (limited) return limited;

  try {
    const { authorizeUrl, cookieValue } = beginGoogleAuthorization(request);
    const response = NextResponse.json(
      { authorizeUrl },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, cookieValue, googleOAuthCookieOptions());
    return response;
  } catch (error) {
    console.error("google_oauth_prepare_failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "google_auth_failed" }, { status: 500 });
  }
}
