import "server-only";

import type { CustomerType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { adminEmailAllowlist, canAdminRemoveCustomer, PRIMARY_ADMIN_EMAIL } from "@/lib/ecommerce/admin";
import { prisma } from "@/lib/ecommerce/db";
import { PAID_PLUS_STATUSES } from "@/lib/ecommerce/orderKpis";
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
      addressLine1: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      city: string | null;
      country: string;
      billingSameAsShipping: boolean;
      billingAddressLine1: string | null;
      billingAddressLine2: string | null;
      billingPostalCode: string | null;
      billingCity: string | null;
      billingCountry: string | null;
      nif: string | null;
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
          addressLine1: user.profile.addressLine1,
          addressLine2: user.profile.addressLine2,
          postalCode: user.profile.postalCode,
          city: user.profile.city,
          country: user.profile.country,
          billingSameAsShipping: user.profile.billingSameAsShipping,
          billingAddressLine1: user.profile.billingAddressLine1,
          billingAddressLine2: user.profile.billingAddressLine2,
          billingPostalCode: user.profile.billingPostalCode,
          billingCity: user.profile.billingCity,
          billingCountry: user.profile.billingCountry,
          nif: user.profile.nif,
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

  const [total, users, totalCustomers, googleSignups, marketingOptIn, newLast7Days, topSpender] = await Promise.all([
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
    getTopSpender(),
  ]);

  return {
    total,
    limit,
    offset,
    stats: { totalCustomers, googleSignups, marketingOptIn, newLast7Days, topSpender },
    customers: users.map((user) => mapCustomer(user)),
  };
}

export async function getTopSpender() {
  const grouped = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { not: null }, status: { in: [...PAID_PLUS_STATUSES] } },
    _sum: { totalCents: true },
    orderBy: { _sum: { totalCents: "desc" } },
    take: 1,
  });
  const winner = grouped[0];
  if (!winner?.userId || !winner._sum.totalCents) return null;
  const user = await prisma.user.findUnique({
    where: { id: winner.userId },
    include: { profile: { select: { fullName: true } } },
  });
  if (!user) return null;
  return {
    userId: user.id,
    name: user.profile?.fullName || user.username,
    email: user.email,
    spentCents: winner._sum.totalCents,
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
    preferredLanguage?: string;
    addressLine1?: string | null;
    addressLine2?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string;
    billingSameAsShipping?: boolean;
    billingAddressLine1?: string | null;
    billingAddressLine2?: string | null;
    billingPostalCode?: string | null;
    billingCity?: string | null;
    billingCountry?: string | null;
    nif?: string | null;
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

  if (input.phone !== undefined && !String(input.phone || "").replace(/\D/g, "").match(/\d{6,}/)) {
    throw new Error("Phone is required.");
  }

  const hasProfilePatch =
    typeof input.marketingOptIn === "boolean" ||
    typeof input.fullName === "string" ||
    typeof input.phoneCountryCode === "string" ||
    input.phone !== undefined ||
    typeof input.customerType === "string" ||
    typeof input.preferredLanguage === "string" ||
    input.addressLine1 !== undefined ||
    input.nif !== undefined ||
    typeof input.billingSameAsShipping === "boolean";

  if (hasProfilePatch) {
    await prisma.customerProfile.update({
      where: { userId },
      data: {
        ...(typeof input.marketingOptIn === "boolean" ? { marketingOptIn: input.marketingOptIn } : {}),
        ...(typeof input.fullName === "string" ? { fullName: input.fullName.trim() } : {}),
        ...(typeof input.phoneCountryCode === "string" ? { phoneCountryCode: input.phoneCountryCode } : {}),
        ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
        ...(typeof input.customerType === "string" ? { customerType: input.customerType } : {}),
        ...(typeof input.preferredLanguage === "string" ? { preferredLanguage: input.preferredLanguage } : {}),
        ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1?.trim() || null } : {}),
        ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2?.trim() || null } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode?.trim() || null } : {}),
        ...(input.city !== undefined ? { city: input.city?.trim() || null } : {}),
        ...(typeof input.country === "string" ? { country: input.country } : {}),
        ...(typeof input.billingSameAsShipping === "boolean" ? { billingSameAsShipping: input.billingSameAsShipping } : {}),
        ...(input.billingAddressLine1 !== undefined ? { billingAddressLine1: input.billingAddressLine1?.trim() || null } : {}),
        ...(input.billingAddressLine2 !== undefined ? { billingAddressLine2: input.billingAddressLine2?.trim() || null } : {}),
        ...(input.billingPostalCode !== undefined ? { billingPostalCode: input.billingPostalCode?.trim() || null } : {}),
        ...(input.billingCity !== undefined ? { billingCity: input.billingCity?.trim() || null } : {}),
        ...(input.billingCountry !== undefined ? { billingCountry: input.billingCountry?.trim() || "PT" } : {}),
        ...(input.nif !== undefined ? { nif: input.nif?.trim() || null } : {}),
      },
    });
  }

  return getCustomerForAdmin(userId);
}
