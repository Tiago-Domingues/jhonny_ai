import "server-only";

import type { CustomerType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/ecommerce/db";

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
