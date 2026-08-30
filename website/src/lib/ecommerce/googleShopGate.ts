import "server-only";

import { prisma } from "@/lib/ecommerce/db";

export const GOOGLE_PHONE_REQUIRED_MESSAGE =
  "Add your phone in My Data before adding to cart or checking out.";

export class GooglePhoneRequiredError extends Error {
  constructor() {
    super(GOOGLE_PHONE_REQUIRED_MESSAGE);
    this.name = "GooglePhoneRequiredError";
  }
}

/** Google accounts cannot shop until My Data has a phone. Password-only accounts are not blocked. */
export async function assertGoogleUserCanShop(userId?: string | null) {
  if (!userId) return;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleSub: true,
      profile: { select: { phone: true } },
    },
  });
  if (!user?.googleSub) return;
  if (user.profile?.phone?.trim()) return;
  throw new GooglePhoneRequiredError();
}
