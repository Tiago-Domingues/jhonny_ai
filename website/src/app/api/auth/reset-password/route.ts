import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { isResetTokenFormat, resetPasswordWithToken } from "@/lib/ecommerce/passwordReset";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "auth-reset-password", 8, 60_000);
  if (limited) return limited;
  try {
    const payload = schema.parse(await readJson(request));
    if (!isResetTokenFormat(payload.token)) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }
    await resetPasswordWithToken(payload.token, payload.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
