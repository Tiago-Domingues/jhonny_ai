import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { loginCustomer } from "@/lib/ecommerce/auth";
import { mergeGuestCartIntoUser, CART_COOKIE } from "@/lib/ecommerce/cart";
import { createSessionToken, setSessionCookie } from "@/lib/ecommerce/session";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();

  try {
    const user = await loginCustomer(await readJson(request));
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(CART_COOKIE)?.value;
    await mergeGuestCartIntoUser(guestToken, user.id);

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
    response.cookies.delete(CART_COOKIE);
    return response;
  } catch (error) {
    return apiError(error, 401);
  }
}
