import Module from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

const originalResolve = (Module as typeof Module & { _resolveFilename: (...args: unknown[]) => string })
  ._resolveFilename;
(Module as typeof Module & { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function (
  request: string,
  ...rest: unknown[]
) {
  if (request === "server-only") {
    return path.join(__dirname, "server-only-stub.cjs");
  }
  return originalResolve.call(this, request, ...rest);
};

dotenv.config({ path: ".env.local" });
dotenv.config();

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const callback = readFileSync(path.resolve(__dirname, "../src/app/api/auth/google/callback/route.ts"), "utf8");
  assert(!callback.includes("sendEmailVerificationEmail"), "Google callback never sends EMAIL_VERIFICATION");
  assert(callback.includes("upsertGoogleCustomer"), "Google callback upserts the customer");

  const registerRoute = readFileSync(path.resolve(__dirname, "../src/app/api/auth/register/route.ts"), "utf8");
  assert(!registerRoute.includes("sendEmailVerificationEmail"), "email register never sends EMAIL_VERIFICATION");

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const stamp = Date.now().toString(36);
  const email = `google-${stamp}@example.com`;
  const sub = `google-sub-${stamp}`;

  try {
    const { upsertGoogleCustomer } = await import("../src/lib/ecommerce/auth");
    const { assertGoogleUserCanShop, GooglePhoneRequiredError } = await import("../src/lib/ecommerce/googleShopGate");

    const { user, created } = await upsertGoogleCustomer({
      sub,
      email,
      email_verified: true,
      name: "Google Tester",
    });
    assert(created, "Google signup creates a new user");
    assert(user.emailVerifiedAt, "Google account is marked verified without a validation email");
    assert(user.googleSub === sub, "Google sub is stored");
    assert(user.role === "CUSTOMER", "normal Google signup stays a customer");
    assert(
      !(await prisma.emailEvent.findFirst({ where: { userId: user.id, type: "EMAIL_VERIFICATION" } })),
      "Google signup does not record a verification email"
    );
    assert(
      !(await prisma.emailEvent.findFirst({ where: { userId: user.id, type: "WELCOME_CUSTOMER" } })),
      "welcome waits until My Data has phone and address"
    );

    let blocked = false;
    try {
      await assertGoogleUserCanShop(user.id);
    } catch (error) {
      blocked = error instanceof GooglePhoneRequiredError;
    }
    assert(blocked, "Google account cannot shop until a phone is saved");

    await prisma.customerProfile.update({
      where: { userId: user.id },
      data: { phone: "912345678" },
    });
    await assertGoogleUserCanShop(user.id);

    const previousAdminEmails = process.env.ADMIN_EMAILS;
    const adminEmail = `admin-google-${stamp}@example.com`;
    process.env.ADMIN_EMAILS = adminEmail;
    try {
      const { user: adminUser, created: adminCreated } = await upsertGoogleCustomer({
        sub: `google-admin-${stamp}`,
        email: adminEmail,
        email_verified: true,
        name: "Admin Google",
      });
      assert(adminCreated, "allowlisted Google signup creates a user");
      assert(adminUser.role === "ADMIN", "allowlisted Google signup is ADMIN");
    } finally {
      if (previousAdminEmails == null) delete process.env.ADMIN_EMAILS;
      else process.env.ADMIN_EMAILS = previousAdminEmails;
    }
  } finally {
    const leftover = await prisma.user.findMany({
      where: { email: { in: [email, `admin-google-${stamp}@example.com`] } },
    });
    for (const row of leftover) {
      await prisma.emailEvent.deleteMany({ where: { userId: row.id } });
      await prisma.customerProfile.deleteMany({ where: { userId: row.id } });
      await prisma.user.delete({ where: { id: row.id } });
    }
    await prisma.$disconnect();
  }

  console.log("google-signup: no validation email, welcome waits for profile, phone required to shop");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
