import {
  isPublicEmailAuthPath,
  isSitePubliclyLaunched,
  isValidPreviewCookie,
  isValidPreviewPassword,
  previewAccessToken,
  shouldEnforceComingSoon,
} from "../src/lib/ecommerce/siteAccess";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const previous = {
  launch: process.env.SITE_PUBLIC_LAUNCH,
  comingSoon: process.env.SITE_COMING_SOON,
  nodeEnv: process.env.NODE_ENV,
  previewPassword: process.env.SITE_PREVIEW_PASSWORD,
};

function restore() {
  if (previous.launch == null) delete process.env.SITE_PUBLIC_LAUNCH;
  else process.env.SITE_PUBLIC_LAUNCH = previous.launch;
  if (previous.comingSoon == null) delete process.env.SITE_COMING_SOON;
  else process.env.SITE_COMING_SOON = previous.comingSoon;
  if (previous.nodeEnv == null) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previous.nodeEnv;
  if (previous.previewPassword == null) delete process.env.SITE_PREVIEW_PASSWORD;
  else process.env.SITE_PREVIEW_PASSWORD = previous.previewPassword;
}

try {
  process.env.SITE_COMING_SOON = "";
  process.env.SITE_PUBLIC_LAUNCH = "true";
  process.env.NODE_ENV = "production";
  assert(!isSitePubliclyLaunched(), "SITE_PUBLIC_LAUNCH=true must not publish the shop");
  assert(shouldEnforceComingSoon(), "production stays under construction when launch is true");

  process.env.SITE_PUBLIC_LAUNCH = "open";
  assert(isSitePubliclyLaunched(), "SITE_PUBLIC_LAUNCH=open is the only public-launch value");
  assert(!shouldEnforceComingSoon(), "open publishes the shop");

  process.env.SITE_COMING_SOON = "true";
  assert(shouldEnforceComingSoon(), "SITE_COMING_SOON=true locks even after launch=open");

  process.env.SITE_COMING_SOON = "";
  process.env.SITE_PUBLIC_LAUNCH = "false";
  process.env.NODE_ENV = "development";
  assert(!shouldEnforceComingSoon(), "local development stays open without an explicit lock");

  process.env.SITE_COMING_SOON = "true";
  assert(shouldEnforceComingSoon(), "local development can still lock with SITE_COMING_SOON");

  process.env.SITE_PREVIEW_PASSWORD = "stale-vercel-preview-password";
  assert(isValidPreviewPassword("DatabyPassion"), "staff preview password unlocks the site");
  assert(!isValidPreviewPassword("stale-vercel-preview-password"), "stale Vercel env password is rejected");
  assert(!isValidPreviewPassword("definitely-wrong"), "wrong preview password is rejected");
  assert(!isValidPreviewPassword(""), "empty preview password is rejected");
  assert(
    isValidPreviewCookie(previewAccessToken("DatabyPassion")),
    "cookie derived from the staff password is accepted"
  );
  assert(
    !isValidPreviewCookie(previewAccessToken("stale-vercel-preview-password")),
    "cookie derived from the stale Vercel password is rejected"
  );

  assert(isPublicEmailAuthPath("/conta/verificar-email"), "verify-email link stays public");
  assert(isPublicEmailAuthPath("/conta/redefinir-password"), "reset-password link stays public");
  assert(isPublicEmailAuthPath("/conta/recuperar-password"), "forgot-password link stays public");
  assert(!isPublicEmailAuthPath("/conta"), "account page stays gated");
  assert(!isPublicEmailAuthPath("/loja"), "shop stays gated");

  console.log("site access helpers ok");
} finally {
  restore();
}
