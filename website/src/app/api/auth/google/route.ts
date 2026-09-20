import { NextRequest, NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { unavailableError } from "@/lib/ecommerce/api";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  beginGoogleAuthorization,
  googleOAuthCookieOptions,
  isGoogleOAuthConfigured,
  resolveRequestOrigin,
} from "@/lib/ecommerce/googleOAuth";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

export const dynamic = "force-dynamic";

function htmlRedirect(authorizeUrl: string, cookieValue: string) {
  const html = `<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(authorizeUrl)}">
  <title>Jhonny Surf Store</title>
</head>
<body>
  <p>A redirecionar para o Google…</p>
  <p><a href="${escapeHtml(authorizeUrl)}">Continuar</a></p>
  <script>location.replace(${JSON.stringify(authorizeUrl)});</script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, cookieValue, googleOAuthCookieOptions());
  return response;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(request: NextRequest) {
  if (!hasDatabaseUrl()) return unavailableError();
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/conta?error=google_not_configured", resolveRequestOrigin(request)));
  }

  const limited = enforceRateLimit(request, "auth-google-start", 20, 60_000);
  if (limited) return limited;

  try {
    const { authorizeUrl, cookieValue } = beginGoogleAuthorization(request);
    return htmlRedirect(authorizeUrl, cookieValue);
  } catch (error) {
    console.error("google_oauth_start_failed", error instanceof Error ? error.message : error);
    return NextResponse.redirect(new URL("/conta?error=google_auth_failed", resolveRequestOrigin(request)));
  }
}
