import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/ecommerce/db";
import { consentSchema } from "@/lib/ecommerce/schemas";
import { hashToken } from "@/lib/ecommerce/security";

export const CONSENT_COOKIE = "jss_consent";
export const CONSENT_POLICY_VERSION = "2026-07-ecommerce-foundation";

const categoryMap = {
  required: "REQUIRED",
  analytics: "ANALYTICS",
  personalization: "PERSONALIZATION",
  marketing: "MARKETING",
} as const;

export async function recordConsent(input: unknown, options: { userId?: string; guestToken?: string }) {
  const data = consentSchema.parse(input);
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") || undefined;

  const entries = Object.entries(data.decisions).map(([key, accepted]) => ({
    userId: options.userId,
    guestToken: options.guestToken ? hashToken(options.guestToken) : undefined,
    category: categoryMap[key as keyof typeof categoryMap],
    decision: accepted ? ("ACCEPTED" as const) : ("REJECTED" as const),
    policyVersion: CONSENT_POLICY_VERSION,
    source: data.source,
    userAgent,
  }));

  await prisma.consentEvent.createMany({ data: entries });
  return data.decisions;
}
