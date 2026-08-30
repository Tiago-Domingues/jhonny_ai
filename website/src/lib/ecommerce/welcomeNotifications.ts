import "server-only";

import { sendWelcomeEmailIfNeeded } from "@/lib/ecommerce/email";
import { isProfileReadyForWelcome } from "@/lib/ecommerce/profileReady";
import { sendWelcomeSmsIfNeeded } from "@/lib/ecommerce/sms";

export async function sendWelcomeNotificationsIfProfileReady(input: {
  userId: string;
  email: string;
  fullName?: string | null;
  phoneCountryCode?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  postalCode?: string | null;
}) {
  if (!isProfileReadyForWelcome(input)) {
    return { sent: false as const, reason: "profile_incomplete" };
  }

  const email = await sendWelcomeEmailIfNeeded({
    userId: input.userId,
    email: input.email,
    fullName: input.fullName,
  }).catch(() => null);
  const sms = await sendWelcomeSmsIfNeeded({
    userId: input.userId,
    fullName: input.fullName,
    phoneCountryCode: input.phoneCountryCode,
    phone: input.phone,
  }).catch(() => null);

  return { sent: true as const, email, sms };
}
