import { createHash, timingSafeEqual } from "crypto";

export const SITE_PREVIEW_COOKIE = "jss_site_preview";

/** Public launch flag — when true, coming-soon gate is off. */
export function isSitePubliclyLaunched() {
  return process.env.SITE_PUBLIC_LAUNCH === "true";
}

/**
 * Gate the marketing/shop UI until launch.
 * - Production (and any non-dev host): gated unless SITE_PUBLIC_LAUNCH=true
 * - Local development: open unless SITE_COMING_SOON=true (for testing the gate)
 */
export function shouldEnforceComingSoon() {
  if (isSitePubliclyLaunched()) return false;
  if (process.env.SITE_COMING_SOON === "true") return true;
  if (process.env.NODE_ENV === "development") return false;
  return true;
}

export function previewAccessToken(password: string) {
  return createHash("sha256").update(`jss-preview:${password}`).digest("hex");
}

export function isValidPreviewPassword(candidate: string) {
  const expected = process.env.SITE_PREVIEW_PASSWORD?.trim();
  if (!expected || !candidate) return false;
  const a = Buffer.from(previewAccessToken(candidate));
  const b = Buffer.from(previewAccessToken(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isValidPreviewCookie(cookieValue: string | undefined) {
  const expected = process.env.SITE_PREVIEW_PASSWORD?.trim();
  if (!expected || !cookieValue) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(previewAccessToken(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
