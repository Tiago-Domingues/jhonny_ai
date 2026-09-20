import Module from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";

const originalResolve = (Module as typeof Module & { _resolveFilename: (...args: unknown[]) => string })
  ._resolveFilename;
(Module as typeof Module & { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function (
  request: string,
  ...rest: unknown[]
) {
  if (request === "server-only") {
    return path.join(__dirname, "server-only-stub.cjs");
  }
  return originalResolve.call(this, request, ...rest);
};

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  process.env.SESSION_SECRET = process.env.SESSION_SECRET?.trim() || "test-session-secret-32-chars-minimum";
  process.env.GOOGLE_CLIENT_ID = "test-google-client-id.apps.googleusercontent.com";
  process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
  process.env.NODE_ENV = "test";

  const {
    beginGoogleAuthorization,
    createSignedOAuthState,
    googleCallbackUrl,
    hashOAuthState,
    isGoogleAuthorizeUrl,
    oauthStateCookieMatches,
    parseSignedOAuthState,
    resolveRequestOrigin,
  } = await import("../src/lib/ecommerce/googleOAuth");

  const origin = resolveRequestOrigin(
    new Request("https://website.vercel.app/api/auth/google", {
      headers: {
        host: "website.vercel.app",
        "x-forwarded-host": "www.jhonnysurfstore.com",
        "x-forwarded-proto": "https",
      },
    })
  );
  assert(origin === "https://www.jhonnysurfstore.com", `origin uses forwarded host, got ${origin}`);

  const apex = resolveRequestOrigin(
    new Request("https://www.jhonnysurfstore.com/api/auth/google", {
      headers: { host: "jhonnysurfstore.com:443", "x-forwarded-proto": "https" },
    })
  );
  assert(apex === "https://jhonnysurfstore.com", `strips https port, got ${apex}`);

  const redirectUri = googleCallbackUrl(origin);
  const state = createSignedOAuthState(redirectUri);
  const parsed = parseSignedOAuthState(state);
  assert(parsed?.redirectUri === redirectUri, "signed state round-trips the callback URL");
  assert(oauthStateCookieMatches(hashOAuthState(state), state), "cookie hash matches signed state");
  assert(!oauthStateCookieMatches(undefined, state), "missing cookie fails the CSRF check");
  assert(!parseSignedOAuthState(`${state}tampered`), "tampered state is rejected");
  assert(!parseSignedOAuthState(state, Date.now() + 11 * 60 * 1000), "expired state is rejected");

  const started = beginGoogleAuthorization(
    new Request("https://website.vercel.app/api/auth/google", {
      headers: {
        host: "website.vercel.app",
        "x-forwarded-host": "www.jhonnysurfstore.pt",
        "x-forwarded-proto": "https",
      },
    })
  );
  assert(started.redirectUri === "https://www.jhonnysurfstore.pt/api/auth/google/callback", "prepare uses the public host");
  assert(isGoogleAuthorizeUrl(started.authorizeUrl), "authorize URL is Google");
  assert(started.authorizeUrl.includes(encodeURIComponent(started.redirectUri)), "Google redirect_uri matches signed state");
  assert(parseSignedOAuthState(started.state)?.redirectUri === started.redirectUri, "start state carries redirect_uri");

  const callback = readFileSync(path.resolve(__dirname, "../src/app/api/auth/google/callback/route.ts"), "utf8");
  assert(callback.includes("parseSignedOAuthState"), "callback verifies signed OAuth state");
  assert(callback.includes("oauthStateCookieMatches"), "callback still requires the first-party state cookie");
  assert(callback.includes("parsed.redirectUri"), "token exchange reuses the start redirect_uri");
  assert(callback.includes("ensureAdminRoleForEmail"), "Google callback promotes allowlisted admins");
  assert(callback.includes("google_oauth_cart_merge_failed"), "cart merge cannot fail Google login");
  assert(callback.includes('export const dynamic = "force-dynamic"'), "callback is not cached");

  const start = readFileSync(path.resolve(__dirname, "../src/app/api/auth/google/route.ts"), "utf8");
  assert(start.includes("location.replace"), "GET /google is an HTML interstitial, not a bounce 302");
  assert(start.includes("beginGoogleAuthorization"), "GET /google signs state before leaving the site");

  const prepare = readFileSync(path.resolve(__dirname, "../src/app/api/auth/google/prepare/route.ts"), "utf8");
  assert(prepare.includes("beginGoogleAuthorization"), "prepare sets the cookie from /conta");
  assert(prepare.includes("authorizeUrl"), "prepare returns the Google URL");

  const account = readFileSync(path.resolve(__dirname, "../src/components/AccountClient.tsx"), "utf8");
  assert(account.includes("/api/auth/google/prepare"), "account modal warms the OAuth cookie on-site");
  assert(account.includes("googleAuthorizeUrl"), "Continue uses the prepared Google URL");

  const auth = readFileSync(path.resolve(__dirname, "../src/lib/ecommerce/auth.ts"), "utf8");
  assert(auth.includes('role: isAdminEmail(email) ? "ADMIN" : "CUSTOMER"'), "new Google users can be admins");

  const config = readFileSync(path.resolve(__dirname, "../next.config.ts"), "utf8");
  assert(config.includes("https://accounts.google.com"), "CSP allows the Google OAuth navigation");

  console.log("google-oauth: signed state, first-party cookie, admin role and CSP checks ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
