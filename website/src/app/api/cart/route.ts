import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { cartAddSchema, cartUpdateSchema } from "@/lib/ecommerce/schemas";
import {
  addCartItem,
  CART_COOKIE,
  CART_MAX_AGE_SECONDS,
  getActiveCart,
  summarizeCart,
  updateCartItem,
} from "@/lib/ecommerce/cart";
import { randomToken } from "@/lib/ecommerce/security";
import { readSessionUser } from "@/lib/ecommerce/session";

async function identity(createToken = false) {
  const session = hasDatabaseUrl() ? await readSessionUser() : null;
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CART_COOKIE)?.value;
  const guestToken = existingToken || (createToken ? randomToken() : undefined);
  return { session, guestToken, createdToken: !existingToken && Boolean(guestToken) };
}

function withCartCookie(response: NextResponse, token?: string, shouldSet = false) {
  if (token && shouldSet) {
    response.cookies.set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: CART_MAX_AGE_SECONDS,
      path: "/",
    });
  }
  return response;
}

export async function GET() {
  if (!hasDatabaseUrl()) {
    return Response.json({ cart: summarizeCart(null), configured: false });
  }
  const { session, guestToken } = await identity(false);
  const cart = await getActiveCart({ userId: session?.id, guestToken });
  return Response.json({ cart: summarizeCart(cart), configured: true });
}

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();

  try {
    const payload = cartAddSchema.parse(await readJson(request));
    const { session, guestToken, createdToken } = await identity(true);
    const cart = await addCartItem(
      { userId: session?.id, guestToken },
      payload.productId,
      payload.quantity
    );
    const response = NextResponse.json({ cart: summarizeCart(cart) });
    return withCartCookie(response, guestToken, createdToken);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();

  try {
    const payload = cartUpdateSchema.parse(await readJson(request));
    const { session, guestToken } = await identity(false);
    const cart = await updateCartItem(
      { userId: session?.id, guestToken },
      payload.itemId,
      payload.quantity
    );
    return Response.json({ cart: summarizeCart(cart) });
  } catch (error) {
    return apiError(error);
  }
}
