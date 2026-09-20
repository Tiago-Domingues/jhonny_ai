import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  DatabaseRestrictedError,
  isDatabaseRestricted,
  noteDatabaseError,
} from "@/lib/ecommerce/databaseHealth";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize the ecommerce database client.");
  }

  // Prisma Postgres requires TLS. Prefer explicit ssl config so adapter-pg
  // does not reject connection-string query params like sslmode.
  const needsSsl =
    connectionString.includes("sslmode=") ||
    connectionString.includes("db.prisma.io") ||
    connectionString.includes("prisma.io");

  const client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // One unpaid Prisma invoice used to fail every query (login, analytics,
  // sitemap). After the first restriction error, skip further Prisma calls
  // on this isolate so the shop can keep using Odoo/static fallbacks.
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        if (isDatabaseRestricted()) {
          throw new DatabaseRestrictedError();
        }
        try {
          return await query(args);
        } catch (error) {
          noteDatabaseError(error);
          throw error;
        }
      },
    },
  }) as unknown as PrismaClient;
}

function getPrismaClient() {
  if (!hasDatabaseUrl()) {
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error("DATABASE_URL is not configured.");
      },
    }) as PrismaClient;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
