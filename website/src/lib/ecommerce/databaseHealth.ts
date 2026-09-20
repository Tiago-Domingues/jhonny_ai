/** Prisma ORM (the library) is free. Prisma Postgres hosting is not. */

export const DATABASE_RESTRICTED_ERROR = "database_restricted";

export const PUBLIC_DATABASE_UNAVAILABLE_MESSAGE =
  "A loja está temporariamente sem base de dados. Tenta outra vez daqui a pouco.";

export function isPrismaHostedDatabaseUrl(url = process.env.DATABASE_URL) {
  const value = String(url || "").toLowerCase();
  return value.includes("db.prisma.io") || value.includes("prisma.io");
}

export function isDatabaseRestrictionError(error: unknown) {
  const text = (
    error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "")
  ).toLowerCase();
  return (
    text.includes("unpaidplaninvoice") ||
    text.includes("account has restrictions") ||
    text.includes("failed to identify your database") ||
    text.includes(DATABASE_RESTRICTED_ERROR)
  );
}

let restricted = false;

export function isDatabaseRestricted() {
  return restricted;
}

export function markDatabaseRestricted() {
  restricted = true;
}

export function resetDatabaseRestrictionFlag() {
  restricted = false;
}

export function noteDatabaseError(error: unknown) {
  if (isDatabaseRestrictionError(error)) {
    markDatabaseRestricted();
    return true;
  }
  return false;
}

export class DatabaseRestrictedError extends Error {
  constructor() {
    super(
      "Failed to identify your database: Your account has restrictions: unpaidPlanInvoice"
    );
    this.name = "DatabaseRestrictedError";
  }
}
