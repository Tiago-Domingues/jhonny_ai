import { NextResponse } from "next/server";
import {
  SITE_PREVIEW_COOKIE,
  isValidPreviewPassword,
  previewAccessToken,
  shouldEnforceComingSoon,
} from "@/lib/ecommerce/siteAccess";

export async function POST(request: Request) {
  if (!shouldEnforceComingSoon()) {
    return NextResponse.json({ ok: true, launched: true });
  }

  const expected = process.env.SITE_PREVIEW_PASSWORD?.trim();
  if (!expected) {
    return NextResponse.json(
      {
        error: "preview_password_not_configured",
        message: "Set SITE_PREVIEW_PASSWORD in Vercel to unlock the site before public launch.",
      },
      { status: 503 }
    );
  }

  let password = "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { password?: string } | null;
    password = String(body?.password ?? "");
  } else {
    const form = await request.formData().catch(() => null);
    password = String(form?.get("password") ?? "");
  }

  if (!isValidPreviewPassword(password)) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SITE_PREVIEW_COOKIE,
    value: previewAccessToken(password),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SITE_PREVIEW_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
