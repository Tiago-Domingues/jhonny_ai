import { createHash, timingSafeEqual } from "crypto";

export const SITE_PREVIEW_COOKIE = "jss_site_preview";

/**
 * The shop is live for the public.
 * Emergency lock only: SITE_COMING_SOON=true (robots go back to Disallow: /).
 * SITE_PUBLIC_LAUNCH is no longer required and cannot hide the shop.
 */
export function isSitePubliclyLaunched() {
  return process.env.SITE_COMING_SOON?.trim() !== "true";
}

/**
 * Gate the marketing/shop UI.
 * Only SITE_COMING_SOON=true locks the site (preview cookie can still unlock).
 */
export function shouldEnforceComingSoon() {
  return process.env.SITE_COMING_SOON?.trim() === "true";
}

const PUBLIC_EMAIL_AUTH_PATHS = new Set([
  "/conta/verificar-email",
  "/conta/redefinir-password",
  "/conta/recuperar-password",
]);

/** Email links must work without the staff preview cookie. */
export function isPublicEmailAuthPath(pathname: string) {
  return PUBLIC_EMAIL_AUTH_PATHS.has(pathname);
}

export function previewAccessToken(password: string) {
  return createHash("sha256").update(`jss-preview:${password}`).digest("hex");
}

/**
 * Coming-soon unlock token used only when SITE_COMING_SOON=true.
 * This is sha256("jss-preview:" + staff password).
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
