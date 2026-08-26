import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const GOOGLE_OAUTH_STATE_COOKIE = "jss_oauth_state";
export const GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Google sign-in is not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
  }
  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

/** Prefer the public origin the browser hit (supports .com / .pt / localhost). */
export function resolveRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || url.host;
  const proto = forwardedProto || (host.includes("localhost") ? "http" : url.protocol.replace(":", ""));
  return `${proto}://${host}`;
}

export function googleCallbackUrl(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function createOAuthState() {
  return randomBytes(24).toString("base64url");
}

export function hashOAuthState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

export function buildGoogleAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const query = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: params.state,
    access_type: "online",
    prompt: "consent select_account",
  });
  return `${GOOGLE_AUTH_URL}?${query.toString()}`;
}

export async function exchangeGoogleCode(params: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}) {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google token exchange returned no access_token.");
  }
  return data.access_token;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google userinfo failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  const data = (await response.json()) as GoogleUserInfo;
  if (!data.sub || !data.email) {
    throw new Error("Google userinfo missing sub or email.");
  }
  return data;
}
