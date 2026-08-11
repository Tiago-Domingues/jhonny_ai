import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { registerCustomer } from "@/lib/ecommerce/auth";
import { sendWelcomeEmail } from "@/lib/ecommerce/email";
import { sendWelcomeSms } from "@/lib/ecommerce/sms";
import { createSessionToken, setSessionCookie } from "@/lib/ecommerce/session";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "auth-register", 8, 60_000);
  if (limited) return limited;

  try {
    const user = await registerCustomer(await readJson(request));
    const token = await createSessionToken(user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.profile?.fullName,
      },
    });
    setSessionCookie(response, token);

    // Finish welcome notifications before returning so serverless does not freeze early.
    // Failures must not undo account creation or the session cookie.
    try {
      await sendWelcomeEmail({
        userId: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
      });
    } catch {
      // logged via EmailEvent when possible
    }
    try {
      await sendWelcomeSms({
        userId: user.id,
        fullName: user.profile?.fullName,
        phoneCountryCode: user.profile?.phoneCountryCode,
        phone: user.profile?.phone,
      });
    } catch {
      // logged via SmsEvent when possible
    }

    return response;
  } catch (error) {
    return apiError(error);
  }
}
