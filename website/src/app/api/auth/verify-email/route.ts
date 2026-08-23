import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { isVerifyTokenFormat, requestEmailVerification, verifyEmailWithToken } from "@/lib/ecommerce/emailVerification";
import { readSessionUser } from "@/lib/ecommerce/session";
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
      await requestEmailVerification(session.id);
      return NextResponse.json({ ok: true });
    }
    const token = payload.token || "";
    if (!isVerifyTokenFormat(token)) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }
    await verifyEmailWithToken(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
