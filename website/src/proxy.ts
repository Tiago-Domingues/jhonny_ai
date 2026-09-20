import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SITE_PREVIEW_COOKIE,
  isPublicEmailAuthPath,
  isValidPreviewCookie,
  shouldEnforceComingSoon,
} from "@/lib/ecommerce/siteAccess";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-jss-pathname", pathname);
  const nextWithPath = () => NextResponse.next({ request: { headers: requestHeaders } });

  if (!shouldEnforceComingSoon()) {
    return nextWithPath();
  }

  const previewCookie = request.cookies.get(SITE_PREVIEW_COOKIE)?.value;
  if (isValidPreviewCookie(previewCookie)) {
    return nextWithPath();
  }

  // Always allow the public teaser + the private unlock page (and static/brand assets via matcher).
  // robots/sitemap must stay reachable so crawlers see Disallow: / until public launch.
  if (
    pathname === "/coming-soon" ||
    pathname === "/preview-access" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    isPublicEmailAuthPath(pathname)
  ) {
    return nextWithPath();
  }

  return NextResponse.rewrite(new URL("/coming-soon", request.url));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|brand|favicon.ico).*)"],
};
