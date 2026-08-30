import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

async function main() {
  const base = (process.env.LAUNCH_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const stamp = Date.now().toString(36);
  const email = `http-register-${stamp}@example.com`;
  const username = `httpreg${stamp}`.slice(0, 32);
  const token = randomToken(32);

  try {
    const register = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({
        email,
        username,
        password: "surflegend1",
        phoneCountryCode: "+351",
        phone: "912345678",
      }),
    });
    const registerBody = await register.json().catch(() => ({}));
    assert(register.ok, `register failed: ${register.status} ${JSON.stringify(registerBody)}`);
    assert(registerBody.pending === true, "register holds the account until the email link");
    assert(!(await prisma.user.findUnique({ where: { email } })), "no User row before the verify link");

    const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
    assert(pending, "register created a pending row");
    assert(pending?.phone === "912345678", "register stored the mobile for welcome SMS");

    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: { tokenHash: hashToken(token) },
    });

    const first = await fetch(`${base}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const firstBody = await first.json().catch(() => ({}));
    assert(first.ok, `first verify failed: ${first.status} ${JSON.stringify(firstBody)}`);
    assert(firstBody.ok === true, "first verify succeeds");
    assert(firstBody.redirect === "/conta", "verify redirects to the account page");
    assert(first.headers.get("set-cookie")?.includes("jss_session"), "verify sets a session cookie");

    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    assert(user?.emailVerifiedAt, "account is verified after the link");
    assert(user?.profile?.phone === "912345678", "verified profile keeps the signup mobile");

    const welcomeEmail = await prisma.emailEvent.findFirst({
      where: { userId: user.id, type: "WELCOME_CUSTOMER" },
    });
    assert(welcomeEmail, "welcome email event is recorded");
    assert(
      welcomeEmail?.status === "SKIPPED" || welcomeEmail?.status === "SENT",
      "welcome email is sent or skipped when SMTP is blank"
    );

    const welcomeSms = await prisma.smsEvent.findFirst({
      where: { userId: user.id, type: "WELCOME_CUSTOMER" },
    });
    assert(welcomeSms, "welcome SMS event is recorded when a mobile was collected");
    assert(
      welcomeSms?.status === "SKIPPED" || welcomeSms?.status === "SENT",
      "welcome SMS is sent or skipped when Twilio is blank"
    );

    const second = await fetch(`${base}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const secondBody = await second.json().catch(() => ({}));
    assert(second.ok, `second verify failed: ${second.status} ${JSON.stringify(secondBody)}`);
    assert(secondBody.ok === true, "clicking the same verify link again still succeeds");
    assert(secondBody.user?.id === user.id, "replay signs in the same account");

    console.log("register-verify-http: register, welcome notifications, and idempotent verify passed");
  } finally {
    const leftover = await prisma.user.findUnique({ where: { email } });
    if (leftover) {
      await prisma.smsEvent.deleteMany({ where: { userId: leftover.id } });
      await prisma.emailEvent.deleteMany({ where: { userId: leftover.id } });
      await prisma.emailVerificationToken.deleteMany({ where: { userId: leftover.id } });
      await prisma.customerProfile.deleteMany({ where: { userId: leftover.id } }).catch(() => null);
      await prisma.user.delete({ where: { id: leftover.id } });
    }
    await prisma.pendingRegistration.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
