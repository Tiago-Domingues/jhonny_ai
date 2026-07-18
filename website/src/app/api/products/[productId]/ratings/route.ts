import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { CART_COOKIE, CART_MAX_AGE_SECONDS } from "@/lib/ecommerce/cart";
import { getProductRatingSummary, upsertProductRating } from "@/lib/ecommerce/ratings";
import { randomToken } from "@/lib/ecommerce/security";
import { readSessionUser } from "@/lib/ecommerce/session";

const rateSchema = z.object({
  stars: z.number().int().min(0).max(5),
});

type RouteContext = {
  params: Promise<{ productId: string }>;
};

async function resolveProduct(productId: string) {
  return prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
      active: true,
      excludedFromCatalog: false,
    },
    select: { id: true },
  });
}

async function identity(createGuestToken = false) {
  const session = await readSessionUser();
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CART_COOKIE)?.value;
  const guestToken = session?.id
    ? undefined
    : existingToken || (createGuestToken ? randomToken() : undefined);
  return {
    session,
    guestToken,
    createdToken: !session?.id && !existingToken && Boolean(guestToken),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  if (!hasDatabaseUrl()) {
    return Response.json({ average: 0, count: 0, myRating: null, configured: false });
  }

  try {
    const { productId: rawId } = await context.params;
    const productId = decodeURIComponent(rawId);
    const product = await resolveProduct(productId);
    if (!product) {
      return Response.json({ error: "product_not_found" }, { status: 404 });
    }

    const { session, guestToken } = await identity(false);
    const summary = await getProductRatingSummary(product.id, {
      userId: session?.id,
      guestToken,
    });
    return Response.json({ ...summary, configured: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!hasDatabaseUrl()) return unavailableError();

  try {
    const { productId: rawId } = await context.params;
    const productId = decodeURIComponent(rawId);
    const product = await resolveProduct(productId);
    if (!product) {
      return Response.json({ error: "product_not_found" }, { status: 404 });
    }

    const payload = rateSchema.parse(await readJson(request));
    const { session, guestToken, createdToken } = await identity(true);
    const summary = await upsertProductRating(product.id, payload.stars, {
      userId: session?.id,
      guestToken,
    });

    const response = NextResponse.json({ ...summary, configured: true });
    if (guestToken && createdToken) {
      response.cookies.set(CART_COOKIE, guestToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: CART_MAX_AGE_SECONDS,
        path: "/",
      });
    }
    return response;
  } catch (error) {
    return apiError(error);
  }
}
