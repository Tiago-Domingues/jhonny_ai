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
