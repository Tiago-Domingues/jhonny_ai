import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { isProductionRuntime, secretsEqual } from "@/lib/ecommerce/securityRuntime";

export const GOOGLE_OAUTH_STATE_COOKIE = "jss_oauth_state";
export const GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const DEV_OAUTH_STATE_SECRET = "dev-only-change-me-before-production";

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

export type SignedOAuthState = {
  nonce: string;
  issuedAt: number;
  redirectUri: string;
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

function oauthStateSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!isProductionRuntime()) {
    return secret || DEV_OAUTH_STATE_SECRET;
  }
  if (!secret || secret === DEV_OAUTH_STATE_SECRET || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or too weak to sign Google OAuth state.");
  }
  return secret;
}

/** Prefer the public origin the browser hit (supports .com / .pt / localhost). */
export function resolveRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const hostHeader = request.headers.get("host")?.split(",")[0]?.trim();
  const host = stripPort(forwardedHost || hostHeader || url.host);
  const proto =
    forwardedProto || (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : url.protocol.replace(":", ""));
  return `${proto}://${host}`;
}

function stripPort(host: string) {
  if (host.startsWith("[") && host.includes("]")) {
    return host.slice(0, host.indexOf("]") + 1);
  }
  const [name, port] = host.split(":");
  if (port === "80" || port === "443") return name;
  return host;
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

export function googleOAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProductionRuntime(),
    maxAge: GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
    path: "/",
  };
}

export function createSignedOAuthState(redirectUri: string) {
  const payload = Buffer.from(
    JSON.stringify({
      n: randomBytes(16).toString("base64url"),
      t: Date.now(),
      r: redirectUri,
    }),
    "utf8"
  ).toString("base64url");
  const signature = createHmac("sha256", oauthStateSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function parseSignedOAuthState(state: string, now = Date.now()): SignedOAuthState | null {
  const separator = state.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = state.slice(0, separator);
  const signature = state.slice(separator + 1);
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", oauthStateSecret()).update(payload).digest("base64url");
  if (!secretsEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      n?: unknown;
      t?: unknown;
      r?: unknown;
    };
    if (typeof parsed.n !== "string" || !parsed.n) return null;
    if (typeof parsed.t !== "number" || !Number.isFinite(parsed.t)) return null;
    if (typeof parsed.r !== "string" || !parsed.r.endsWith("/api/auth/google/callback")) return null;
    if (parsed.t - 30_000 > now) return null;
    if (now - parsed.t > GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS * 1000) return null;
    return { nonce: parsed.n, issuedAt: parsed.t, redirectUri: parsed.r };
  } catch {
    return null;
  }
}

export function oauthStateCookieMatches(cookieValue: string | undefined, state: string) {
  if (!cookieValue) return false;
  return secretsEqual(cookieValue, hashOAuthState(state));
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

export function beginGoogleAuthorization(request: Request) {
  const { clientId } = getGoogleOAuthConfig();
  const origin = resolveRequestOrigin(request);
  const redirectUri = googleCallbackUrl(origin);
  const state = createSignedOAuthState(redirectUri);
  const authorizeUrl = buildGoogleAuthorizeUrl({ clientId, redirectUri, state });
  return {
    origin,
    redirectUri,
    state,
    authorizeUrl,
    cookieValue: hashOAuthState(state),
  };
}

export function isGoogleAuthorizeUrl(value: string) {
  return value.startsWith(`${GOOGLE_AUTH_URL}?`);
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
