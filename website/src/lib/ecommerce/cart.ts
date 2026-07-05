import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { ensureProduct } from "@/lib/ecommerce/catalog";
import { hashToken } from "@/lib/ecommerce/security";

export const CART_COOKIE = "jss_cart";
export const CART_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type CartIdentity = {
  userId?: string;
  guestToken?: string;
};

export async function getActiveCart(identity: CartIdentity) {
  const where = identity.userId
    ? { userId: identity.userId, status: "ACTIVE" as const }
    : identity.guestToken
      ? { guestTokenHash: hashToken(identity.guestToken), status: "ACTIVE" as const }
      : null;
  if (!where) return null;

  return prisma.cart.findFirst({
    where,
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getOrCreateCart(identity: CartIdentity) {
  const existing = await getActiveCart(identity);
  if (existing) return existing;

  return prisma.cart.create({
    data: {
      userId: identity.userId,
      guestTokenHash: identity.userId ? null : identity.guestToken ? hashToken(identity.guestToken) : null,
      expiresAt: new Date(Date.now() + CART_MAX_AGE_SECONDS * 1000),
    },
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function addCartItem(identity: CartIdentity, productId: string, quantity: number) {
  const product = await ensureProduct(productId);
  if (!product) throw new Error("Product not found.");
  if (!product.availableForSale || product.stockQuantity <= 0) {
    throw new Error("This product is currently out of stock. Use ask when available instead.");
  }

  const cart = await getOrCreateCart(identity);
  const existing = cart.items.find((item) => item.productId === product.id);
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > product.stockQuantity) {
    throw new Error(`Only ${product.stockQuantity} unit(s) are available.`);
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    update: {
      quantity: { increment: quantity },
      unitPriceCents: product.priceCents,
      currency: product.currency,
    },
    create: {
      cartId: cart.id,
      productId: product.id,
      quantity,
      unitPriceCents: product.priceCents,
      currency: product.currency,
    },
  });

  return getActiveCart(identity);
}

export async function updateCartItem(identity: CartIdentity, itemId: string, quantity: number) {
  const cart = await getActiveCart(identity);
  if (!cart) throw new Error("Cart not found.");

  const item = cart.items.find((entry) => entry.id === itemId);
  if (!item) throw new Error("Cart item not found.");

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    if (!item.product.availableForSale || item.product.stockQuantity <= 0) {
      throw new Error("This product is currently out of stock. Use ask when available instead.");
    }
    if (quantity > item.product.stockQuantity) {
      throw new Error(`Only ${item.product.stockQuantity} unit(s) are available.`);
    }
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  return getActiveCart(identity);
}

export async function mergeGuestCartIntoUser(guestToken: string | undefined, userId: string) {
  if (!guestToken) return getOrCreateCart({ userId });

  const guestCart = await getActiveCart({ guestToken });
  const userCart = await getOrCreateCart({ userId });
  if (!guestCart || guestCart.id === userCart.id) return userCart;

  for (const item of guestCart.items) {
    if (item.quantity > item.product.stockQuantity || !item.product.availableForSale) {
      continue;
    }
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
      update: { quantity: { increment: item.quantity } },
      create: {
        cartId: userCart.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        currency: item.currency,
      },
    });
  }

  await prisma.cart.update({ where: { id: guestCart.id }, data: { status: "ORDERED" } });
  return getActiveCart({ userId });
}

export function summarizeCart(cart: Awaited<ReturnType<typeof getActiveCart>>) {
  const items =
    cart?.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.unitPriceCents * item.quantity,
      currency: item.currency,
    })) || [];
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);

  return {
    id: cart?.id || null,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents,
    currency: cart?.currency || "EUR",
  };
}
