import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { originFromRequest } from "@/lib/ecommerce/stripeCheckout";
import {
  completeRegistrationWithToken,
  isVerifyTokenFormat,
  requestEmailVerification,
} from "@/lib/ecommerce/emailVerification";
import { createSessionToken, readSessionUser, setSessionCookie } from "@/lib/ecommerce/session";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

const schema = z.object({
  token: z.string().min(20).max(200).optional(),
  resend: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "auth-verify-email", 8, 60_000);
  if (limited) return limited;
  try {
    const payload = schema.parse(await readJson(request));
    if (payload.resend) {
      const session = await readSessionUser();
      if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      await requestEmailVerification(session.id, originFromRequest(request));
      return NextResponse.json({ ok: true });
    }
    const token = payload.token || "";
    if (!isVerifyTokenFormat(token)) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }
    const { user } = await completeRegistrationWithToken(token);
    const sessionToken = await createSessionToken(user.id);
    const response = NextResponse.json({
      ok: true,
      redirect: "/conta",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.profile?.fullName,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    });
    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    return apiError(error);
  }
}
