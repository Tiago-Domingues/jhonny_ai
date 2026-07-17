import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export function createScriptPrismaClient() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const needsSsl =
    connectionString.includes("sslmode=") ||
    connectionString.includes("db.prisma.io") ||
    connectionString.includes("prisma.io");

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    }),
  });
}
