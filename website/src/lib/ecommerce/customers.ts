import "server-only";

import type { CustomerType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { adminEmailAllowlist, canAdminRemoveCustomer, PRIMARY_ADMIN_EMAIL } from "@/lib/ecommerce/admin";
import { prisma } from "@/lib/ecommerce/db";
import { normalizeEmail } from "@/lib/ecommerce/security";

export type AdminCustomerListInput = {
  q?: string;
  auth?: "all" | "google" | "password";
  marketing?: "all" | "yes" | "no";
  limit?: number;
  offset?: number;
};

function mapCustomer(
  user: Awaited<ReturnType<typeof prisma.user.findFirstOrThrow>> & {
    profile: {
      fullName: string;
      phoneCountryCode: string;
      phone: string | null;
      customerType: CustomerType;
      preferredLanguage: string;
      city: string | null;
      country: string;
      marketingOptIn: boolean;
      odooPartnerId: number | null;
      odooSyncStatus: string;
    } | null;
    _count: { orders: number };
  }
) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
    hasGoogle: Boolean(user.googleSub),
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    orderCount: user._count.orders,
    profile: user.profile
      ? {
          fullName: user.profile.fullName,
          phoneCountryCode: user.profile.phoneCountryCode,
          phone: user.profile.phone,
          customerType: user.profile.customerType,
          preferredLanguage: user.profile.preferredLanguage,
          city: user.profile.city,
          country: user.profile.country,
          marketingOptIn: user.profile.marketingOptIn,
          odooPartnerId: user.profile.odooPartnerId,
          odooSyncStatus: user.profile.odooSyncStatus,
        }
      : null,
  };
}

export async function listCustomersForAdmin(input: AdminCustomerListInput = {}) {
  const q = input.q?.trim();
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const offset = Math.max(input.offset ?? 0, 0);

  const and: Prisma.UserWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
        { profile: { is: { fullName: { contains: q, mode: "insensitive" } } } },
        { profile: { is: { phone: { contains: q } } } },
      ],
    });
  }

  if (input.auth === "google") {
    and.push({ googleSub: { not: null } });
  } else if (input.auth === "password") {
    and.push({ passwordHash: { not: null } });
  }

  if (input.marketing === "yes") {
    and.push({ profile: { is: { marketingOptIn: true } } });
  } else if (input.marketing === "no") {
    and.push({ profile: { is: { marketingOptIn: false } } });
  }

  const where: Prisma.UserWhereInput = and.length ? { AND: and } : {};

  const [total, users, totalCustomers, googleSignups, marketingOptIn, newLast7Days] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.user.count(),
    prisma.user.count({ where: { googleSub: { not: null } } }),
    prisma.customerProfile.count({ where: { marketingOptIn: true } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    total,
    limit,
    offset,
    stats: { totalCustomers, googleSignups, marketingOptIn, newLast7Days },
    customers: users.map((user) => mapCustomer(user)),
  };
}

export async function getCustomerForAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, _count: { select: { orders: true } } },
  });
  return user ? mapCustomer(user) : null;
}

async function deleteCustomerRelatedData(tx: Prisma.TransactionClient, user: { id: string; email: string }) {
  await tx.cart.deleteMany({ where: { userId: user.id } });
  await tx.consentEvent.deleteMany({ where: { userId: user.id } });
  await tx.emailEvent.deleteMany({ where: { userId: user.id } });
  await tx.smsEvent.deleteMany({ where: { userId: user.id } });
  await tx.couponUsage.updateMany({ where: { userId: user.id }, data: { userId: null } });
  await tx.pendingRegistration.deleteMany({ where: { email: user.email } });
  await tx.availabilityRequest.deleteMany({ where: { email: user.email } });
  await tx.user.delete({ where: { id: user.id } });
}

export async function deleteCustomerForAdmin(
  userId: string,
  actor: { id: string; email: string }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) return null;

  const allowed = canAdminRemoveCustomer({
    actorId: actor.id,
    targetId: user.id,
    targetEmail: user.email,
    protectedEmails: adminEmailAllowlist(),
  });
  if (!allowed.ok) {
    throw new Error(allowed.message);
  }

  await prisma.$transaction(async (tx) => {
    await deleteCustomerRelatedData(tx, user);
  });
  return { ok: true as const, email: user.email };
}

export async function purgeCustomersKeeping(keepEmail = PRIMARY_ADMIN_EMAIL) {
  const keep = normalizeEmail(keepEmail);
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  let removed = 0;
  const kept: string[] = [];

  for (const user of users) {
    if (normalizeEmail(user.email) === keep) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN", emailVerifiedAt: new Date() },
      });
      kept.push(user.email);
      continue;
    }
    await prisma.$transaction(async (tx) => {
      await deleteCustomerRelatedData(tx, user);
    });
    removed += 1;
  }

  const [pending, guests, availability, orphanEmails, orphanSms] = await Promise.all([
    prisma.pendingRegistration.deleteMany({
      where: { NOT: { email: { equals: keep, mode: "insensitive" } } },
    }),
    prisma.guestCheckout.deleteMany({
      where: { NOT: { email: { equals: keep, mode: "insensitive" } } },
    }),
    prisma.availabilityRequest.deleteMany({
      where: { NOT: { email: { equals: keep, mode: "insensitive" } } },
    }),
    prisma.emailEvent.deleteMany({
      where: {
        userId: null,
        NOT: { recipientEmail: { equals: keep, mode: "insensitive" } },
      },
    }),
    prisma.smsEvent.deleteMany({
      where: { userId: null },
    }),
  ]);

  return {
    keptEmail: keep,
    keptAccounts: kept.length,
    removedAccounts: removed,
    removedPending: pending.count,
    removedGuestCheckouts: guests.count,
    removedAvailabilityRequests: availability.count,
    removedOrphanEmailEvents: orphanEmails.count,
    removedOrphanSmsEvents: orphanSms.count,
  };
}

export async function updateCustomerForAdmin(
  userId: string,
  input: {
    marketingOptIn?: boolean;
    fullName?: string;
    phoneCountryCode?: string;
    phone?: string | null;
    customerType?: CustomerType;
    role?: "CUSTOMER" | "ADMIN";
  }
) {
  if (input.role) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (existing && input.role !== "ADMIN" && adminEmailAllowlist().has(normalizeEmail(existing.email))) {
      throw new Error("This admin account is protected.");
    }
    await prisma.user.update({
      where: { id: userId },
      data: { role: input.role },
    });
  }

  const hasProfilePatch =
    typeof input.marketingOptIn === "boolean" ||
    typeof input.fullName === "string" ||
    typeof input.phoneCountryCode === "string" ||
    input.phone !== undefined ||
    typeof input.customerType === "string";

  if (hasProfilePatch) {
    await prisma.customerProfile.update({
      where: { userId },
      data: {
        ...(typeof input.marketingOptIn === "boolean" ? { marketingOptIn: input.marketingOptIn } : {}),
        ...(typeof input.fullName === "string" ? { fullName: input.fullName.trim() } : {}),
        ...(typeof input.phoneCountryCode === "string" ? { phoneCountryCode: input.phoneCountryCode } : {}),
        ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
        ...(typeof input.customerType === "string" ? { customerType: input.customerType } : {}),
      },
    });
  }

  return getCustomerForAdmin(userId);
}
