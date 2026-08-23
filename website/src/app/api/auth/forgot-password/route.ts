import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { requestPasswordReset } from "@/lib/ecommerce/passwordReset";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "auth-forgot-password", 5, 60_000);
  if (limited) return limited;
  try {
    const payload = schema.parse(await readJson(request));
    await requestPasswordReset(payload.email);
    return NextResponse.json({
      ok: true,
      message: "If that email is registered, we sent reset instructions.",
    });
  } catch (error) {
    return apiError(error);
  }
}
