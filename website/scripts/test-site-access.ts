import {
  isPublicEmailAuthPath,
  isSitePubliclyLaunched,
  isValidPreviewCookie,
  isValidPreviewPassword,
  previewAccessToken,
  shouldEnforceComingSoon,
} from "../src/lib/ecommerce/siteAccess";
import robots from "../src/app/robots";

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
  process.env.NODE_ENV = "production";
  process.env.SITE_COMING_SOON = "";
  process.env.SITE_PUBLIC_LAUNCH = "false";
  assert(isSitePubliclyLaunched(), "the shop is public without SITE_PUBLIC_LAUNCH");
  assert(!shouldEnforceComingSoon(), "production is not under construction by default");

  process.env.SITE_PUBLIC_LAUNCH = "true";
  assert(isSitePubliclyLaunched(), "SITE_PUBLIC_LAUNCH leftover values do not hide the shop");
  assert(!shouldEnforceComingSoon(), "SITE_PUBLIC_LAUNCH cannot lock the shop");

  process.env.SITE_COMING_SOON = "true";
  assert(!isSitePubliclyLaunched(), "SITE_COMING_SOON=true is the emergency lock");
  assert(shouldEnforceComingSoon(), "emergency lock rewrites to coming-soon");

  process.env.SITE_COMING_SOON = "";
  process.env.NODE_ENV = "development";
  assert(!shouldEnforceComingSoon(), "local development stays open");

  process.env.SITE_COMING_SOON = "true";
  assert(shouldEnforceComingSoon(), "local development can still lock with SITE_COMING_SOON");
  assert(isValidPreviewPassword("DatabyPassion"), "staff preview password still unlocks an emergency lock");
  assert(!isValidPreviewPassword("definitely-wrong"), "wrong preview password is rejected");
  assert(
    isValidPreviewCookie(previewAccessToken("DatabyPassion")),
    "cookie derived from the staff password is accepted"
  );

  assert(isPublicEmailAuthPath("/conta/verificar-email"), "verify-email link stays public");
  assert(isPublicEmailAuthPath("/conta/redefinir-password"), "reset-password link stays public");
  assert(isPublicEmailAuthPath("/conta/recuperar-password"), "forgot-password link stays public");
  assert(!isPublicEmailAuthPath("/conta"), "account page is not an email-auth exception");
  assert(!isPublicEmailAuthPath("/loja"), "shop is not an email-auth exception");

  process.env.SITE_COMING_SOON = "";
  const liveRobots = robots();
  const liveRules = Array.isArray(liveRobots.rules) ? liveRobots.rules[0] : liveRobots.rules;
  assert(liveRules?.allow === "/", "live robots allow the public site");
  assert(liveRobots.sitemap?.includes("/sitemap.xml"), "live robots advertise the sitemap");
  assert(
    Array.isArray(liveRules?.disallow) && liveRules.disallow.includes("/admin"),
    "live robots keep admin out of the index"
  );

  process.env.SITE_COMING_SOON = "true";
  const lockedRobots = robots();
  const lockedRules = Array.isArray(lockedRobots.rules) ? lockedRobots.rules[0] : lockedRobots.rules;
  assert(lockedRules?.disallow === "/", "emergency lock tells crawlers not to index");

  console.log("site access helpers ok");
} finally {
  restore();
}
