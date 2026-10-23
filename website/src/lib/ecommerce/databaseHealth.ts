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

/** How long a warm isolate skips Prisma after an unpaid-invoice error. */
export const DATABASE_RESTRICTION_COOLDOWN_MS = 15_000;

let restrictedUntil = 0;

export function isDatabaseRestricted(now = Date.now()) {
  return restrictedUntil > now;
}

export function markDatabaseRestricted(now = Date.now()) {
  restrictedUntil = now + DATABASE_RESTRICTION_COOLDOWN_MS;
}

export function resetDatabaseRestrictionFlag() {
  restrictedUntil = 0;
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
