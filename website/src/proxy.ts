import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SITE_PREVIEW_COOKIE,
  isValidPreviewCookie,
  shouldEnforceComingSoon,
} from "@/lib/ecommerce/siteAccess";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!shouldEnforceComingSoon()) {
    return NextResponse.next();
  }

  const previewCookie = request.cookies.get(SITE_PREVIEW_COOKIE)?.value;
  if (isValidPreviewCookie(previewCookie)) {
    return NextResponse.next();
  }

  // Always allow the public teaser + the private unlock page (and static/brand assets via matcher).
  if (pathname === "/coming-soon" || pathname === "/preview-access") {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/coming-soon", request.url));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|brand|favicon.ico).*)"],
};
