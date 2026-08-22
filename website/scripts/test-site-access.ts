import { isSitePubliclyLaunched, shouldEnforceComingSoon } from "../src/lib/ecommerce/siteAccess";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const previous = {
  launch: process.env.SITE_PUBLIC_LAUNCH,
  comingSoon: process.env.SITE_COMING_SOON,
  nodeEnv: process.env.NODE_ENV,
};

function restore() {
  if (previous.launch == null) delete process.env.SITE_PUBLIC_LAUNCH;
  else process.env.SITE_PUBLIC_LAUNCH = previous.launch;
  if (previous.comingSoon == null) delete process.env.SITE_COMING_SOON;
  else process.env.SITE_COMING_SOON = previous.comingSoon;
  if (previous.nodeEnv == null) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previous.nodeEnv;
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

  console.log("site access helpers ok");
} finally {
  restore();
}
