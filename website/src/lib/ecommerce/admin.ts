import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { defaultAdminEmails } from "@/lib/ecommerce/adminAccess";
import { normalizeEmail } from "@/lib/ecommerce/security";

export { PRIMARY_ADMIN_EMAIL, canAdminRemoveCustomer } from "@/lib/ecommerce/adminAccess";

export function adminEmailAllowlist() {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...defaultAdminEmails(), ...fromEnv].map((email) => email.toLowerCase()));
}

export function isAdminEmail(email: string) {
  return adminEmailAllowlist().has(normalizeEmail(email));
}

/** Promote allowlisted emails to ADMIN (idempotent). */
export async function ensureAdminRoleForEmail(userId: string, email: string) {
  if (!isAdminEmail(email)) return null;
  return prisma.user.updateMany({
    where: { id: userId, role: { not: "ADMIN" } },
    data: { role: "ADMIN" },
  });
}

export async function requireAdminSession() {
  const { readSessionUser } = await import("@/lib/ecommerce/session");
  const session = await readSessionUser();
  if (!session || session.role !== "ADMIN") {
    return null;
  }
  return session;
}
