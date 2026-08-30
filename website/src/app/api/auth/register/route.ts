import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { startPendingRegistration } from "@/lib/ecommerce/emailVerification";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";
import { originFromRequest } from "@/lib/ecommerce/stripeCheckout";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "auth-register", 8, 60_000);
  if (limited) return limited;

  try {
    await startPendingRegistration(await readJson(request), originFromRequest(request));
    return NextResponse.json({ pending: true });
  } catch (error) {
    return apiError(error);
  }
}
