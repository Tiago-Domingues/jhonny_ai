import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { sendAbandonedCartEmail } from "@/lib/ecommerce/email";

const DEFAULT_MIN_AGE_HOURS = 24;
const MAX_CARTS_PER_RUN = 80;

export function abandonedCartMinAgeHours() {
  const parsed = Number(process.env.ABANDONED_CART_MIN_AGE_HOURS);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MIN_AGE_HOURS;
  return Math.min(parsed, 24 * 30);
}

export async function processAbandonedCartReminders() {
  const minAgeHours = abandonedCartMinAgeHours();
  const cutoff = new Date(Date.now() - minAgeHours * 60 * 60 * 1000);

  const carts = await prisma.cart.findMany({
    where: {
      status: "ACTIVE",
      userId: { not: null },
      items: { some: {} },
    },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              fullName: true,
              marketingOptIn: true,
              preferredLanguage: true,
            },
          },
        },
      },
    },
    take: 400,
  });

  const considered = carts.length;
  let sent = 0;
  let skippedNoConsent = 0;
  let skippedFresh = 0;
  let skippedDeduped = 0;
  let skippedGuest = 0;

  for (const cart of carts) {
    if (sent >= MAX_CARTS_PER_RUN) break;
    if (!cart.userId || !cart.user) {
      skippedGuest += 1;
      continue;
    }
    if (!cart.user.profile?.marketingOptIn) {
      skippedNoConsent += 1;
      continue;
    }
    if (!cart.items.length) continue;

    const lastActivity = cart.items.reduce(
      (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
      cart.items[0].updatedAt
    );
    if (lastActivity > cutoff) {
      skippedFresh += 1;
      continue;
    }

    const alreadySent = await prisma.emailEvent.findFirst({
      where: {
        userId: cart.userId,
        type: "ABANDONED_CART",
        createdAt: { gte: lastActivity },
      },
      select: { id: true },
    });
    if (alreadySent) {
      skippedDeduped += 1;
      continue;
    }

    const totalCents = cart.items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0
    );
    await sendAbandonedCartEmail({
      userId: cart.userId,
      email: cart.user.email,
      fullName: cart.user.profile.fullName,
      locale: cart.user.profile.preferredLanguage,
      items: cart.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })),
      totalCents,
    });
    sent += 1;
  }

  return {
    ok: true,
    minAgeHours,
    considered,
    sent,
    skippedNoConsent,
    skippedFresh,
    skippedDeduped,
    skippedGuest,
  };
}
