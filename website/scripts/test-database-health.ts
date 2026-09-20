import { apiError } from "../src/lib/ecommerce/api";
import {
  PUBLIC_DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseRestricted,
  isDatabaseRestrictionError,
  isPrismaHostedDatabaseUrl,
  markDatabaseRestricted,
  resetDatabaseRestrictionFlag,
} from "../src/lib/ecommerce/databaseHealth";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  resetDatabaseRestrictionFlag();

  assert(isPrismaHostedDatabaseUrl("postgresql://user@db.prisma.io:5432/postgres"), "detects Prisma Postgres host");
  assert(!isPrismaHostedDatabaseUrl("postgresql://user@ep-cool.neon.tech/neondb"), "Neon is not Prisma hosted");

  const invoice = new Error(
    "Failed to identify your database: Your account has restrictions: unpaidPlanInvoice. Please contact Prisma support."
  );
  assert(isDatabaseRestrictionError(invoice), "detects unpaidPlanInvoice");
  assert(!isDatabaseRestrictionError(new Error("Email, username ou password inválidos.")), "normal login errors stay normal");

  const response = apiError(invoice, 401);
  assert(response.status === 503, "restriction errors are 503, not 401");
  const body = await response.json();
  assert(body.error === "database_unavailable", "restriction uses database_unavailable");
  assert(body.message === PUBLIC_DATABASE_UNAVAILABLE_MESSAGE, "customers do not see the Prisma invoice text");
  assert(!String(body.message).toLowerCase().includes("unpaid"), "invoice wording is stripped");

  assert(isDatabaseRestricted(), "first restriction trip sets the circuit breaker");
  markDatabaseRestricted();
  assert(isDatabaseRestricted(), "breaker stays on for this isolate");
  resetDatabaseRestrictionFlag();
  assert(!isDatabaseRestricted(), "tests can reset the breaker");

  console.log("database health helpers ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
