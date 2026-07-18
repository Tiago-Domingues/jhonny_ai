import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { hashToken } from "@/lib/ecommerce/security";

export type RatingIdentity = {
  userId?: string;
  guestToken?: string;
};

export type ProductRatingSummary = {
  average: number;
  count: number;
  myRating: number | null;
};

function raterKeyFromIdentity(identity: RatingIdentity) {
  if (identity.userId) return `user:${identity.userId}`;
  if (identity.guestToken) return `guest:${hashToken(identity.guestToken)}`;
  return null;
}

export async function getProductRatingSummary(
  productId: string,
  identity: RatingIdentity = {}
): Promise<ProductRatingSummary> {
  const [aggregate, mine] = await Promise.all([
    prisma.productRating.aggregate({
      where: { productId },
      _avg: { stars: true },
      _count: { _all: true },
    }),
    (() => {
      const raterKey = raterKeyFromIdentity(identity);
      if (!raterKey) return Promise.resolve(null);
      return prisma.productRating.findUnique({
        where: { productId_raterKey: { productId, raterKey } },
        select: { stars: true },
      });
    })(),
  ]);

  const count = aggregate._count._all;
  const average = count > 0 ? Number((aggregate._avg.stars || 0).toFixed(1)) : 0;

  return {
    average,
    count,
    myRating: mine?.stars ?? null,
  };
}

export async function upsertProductRating(
  productId: string,
  stars: number,
  identity: RatingIdentity
) {
  if (!Number.isInteger(stars) || stars < 0 || stars > 5) {
    throw new Error("Stars must be an integer from 0 to 5.");
  }

  const raterKey = raterKeyFromIdentity(identity);
  if (!raterKey) {
    throw new Error("A session or guest token is required to rate products.");
  }

  const guestTokenHash = identity.userId
    ? null
    : identity.guestToken
      ? hashToken(identity.guestToken)
      : null;

  await prisma.productRating.upsert({
    where: { productId_raterKey: { productId, raterKey } },
    create: {
      productId,
      userId: identity.userId || null,
      guestTokenHash,
      raterKey,
      stars,
    },
    update: {
      stars,
      userId: identity.userId || null,
      guestTokenHash,
    },
  });

  return getProductRatingSummary(productId, identity);
}
