import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson } from "@/lib/ecommerce/api";
import { CART_COOKIE } from "@/lib/ecommerce/cart";
import { CONSENT_COOKIE, CONSENT_POLICY_VERSION, recordConsent } from "@/lib/ecommerce/consent";
import { readSessionUser } from "@/lib/ecommerce/session";

export async function POST(request: Request) {
  try {
    const payload = await readJson(request);
    const cookieStore = await cookies();
    const session = hasDatabaseUrl() ? await readSessionUser() : null;
    const guestToken = cookieStore.get(CART_COOKIE)?.value;
    const decisions = hasDatabaseUrl()
      ? await recordConsent(payload, { userId: session?.id, guestToken })
      : payload.decisions;

    const response = NextResponse.json({ decisions, policyVersion: CONSENT_POLICY_VERSION });
    response.cookies.set(CONSENT_COOKIE, JSON.stringify({ decisions, policyVersion: CONSENT_POLICY_VERSION }), {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 180,
      path: "/",
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
