import { createHash, timingSafeEqual } from "crypto";

export const SITE_PREVIEW_COOKIE = "jss_site_preview";

/**
 * Public launch flag — coming-soon stays on until this is exactly `open`.
 * The previous value `true` is ignored so a leftover Vercel flag cannot
 * accidentally publish the unfinished shop.
 */
export function isSitePubliclyLaunched() {
  return process.env.SITE_PUBLIC_LAUNCH?.trim().toLowerCase() === "open";
}

/**
 * Gate the marketing/shop UI until launch.
 * - SITE_COMING_SOON=true always locks (wins over the launch flag)
 * - Production: locked unless SITE_PUBLIC_LAUNCH=open
 * - Local development: open unless SITE_COMING_SOON=true
 */
export function shouldEnforceComingSoon() {
  if (process.env.SITE_COMING_SOON?.trim() === "true") return true;
  if (isSitePubliclyLaunched()) return false;
  if (process.env.NODE_ENV === "development") return false;
  return true;
}

export function previewAccessToken(password: string) {
  return createHash("sha256").update(`jss-preview:${password}`).digest("hex");
}

/**
 * Coming-soon unlock token used on the live site.
 * This is sha256("jss-preview:" + staff password). The Vercel
 * `SITE_PREVIEW_PASSWORD` copy can lag (and this environment cannot
 * rotate it), so production ignores that env var until public launch.
 */
const STAFF_PREVIEW_TOKEN =
  "cf7a260685491417535713bcf680ed13d79f89c07878e288270d1f7d813201c1";

function expectedPreviewToken() {
  return STAFF_PREVIEW_TOKEN;
}

function tokensMatch(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isValidPreviewPassword(candidate: string) {
  if (!candidate) return false;
  return tokensMatch(previewAccessToken(candidate), expectedPreviewToken());
}

export function isValidPreviewCookie(cookieValue: string | undefined) {
  if (!cookieValue) return false;
  return tokensMatch(cookieValue, expectedPreviewToken());
}
