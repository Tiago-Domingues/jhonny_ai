import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { registerCustomer } from "@/lib/ecommerce/auth";
import { sendWelcomeEmail } from "@/lib/ecommerce/email";
import { createSessionToken, setSessionCookie } from "@/lib/ecommerce/session";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();

  try {
    const user = await registerCustomer(await readJson(request));
    await sendWelcomeEmail({
      userId: user.id,
      email: user.email,
      fullName: user.profile?.fullName,
    });
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
    return response;
  } catch (error) {
    return apiError(error);
  }
}
