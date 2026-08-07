import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { normalizeEmail } from "@/lib/ecommerce/security";

/** Comma-separated admin emails. Always includes the store inbox by default. */
export function adminEmailAllowlist() {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
  const defaults = [normalizeEmail("jhonnysurfstore@gmail.com")];
  return Array.from(new Set([...defaults, ...fromEnv]));
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmailAllowlist().includes(normalizeEmail(email));
}

/** Promote allowlisted emails to ADMIN (idempotent). */
export async function ensureAdminRoleForEmail(userId: string, email: string) {
  if (!isAdminEmail(email)) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });
  return true;
}
