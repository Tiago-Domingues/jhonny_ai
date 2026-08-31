import { createHash, randomBytes } from "node:crypto";
import Module from "node:module";
import path from "node:path";
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
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const stamp = Date.now().toString(36);
  const email = `flow-${stamp}@example.com`;
  const username = `flow${stamp}`.slice(0, 32);
  const token = randomToken(32);

  try {
    const register = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ email, username, password: "surflegend1" }),
    });
    const registerBody = await register.json().catch(() => ({}));
    assert(register.ok, `register failed ${register.status} ${JSON.stringify(registerBody)}`);
    const verifyEvent = await prisma.emailEvent.findFirst({
      where: { recipientEmail: email, type: "EMAIL_VERIFICATION" },
      orderBy: { createdAt: "desc" },
    });
    assert(verifyEvent, "verification email event is recorded");
    assert(["SENT", "SKIPPED", "FAILED"].includes(verifyEvent.status), "verification email attempt is recorded");

    let cookie = register.headers.get("set-cookie") || "";
    if (verifyEvent.status === "SENT") {
      assert(registerBody.pending === true, "register waits for the email link when mail is sent");
      const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
      assert(pending, "pending registration exists when mail is sent");
      assert(pending.marketingOptIn === true, "register defaults marketing opt-in");
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
      assert(first.ok, `first verify failed ${first.status} ${JSON.stringify(firstBody)}`);
      cookie = first.headers.get("set-cookie") || "";
    } else {
      assert(registerBody.pending === false, "register creates the account when email is not sent");
      assert(registerBody.emailSent === false, "API does not claim an email was sent");
      assert(registerBody.user?.email === email, "register returns the new user");
      assert(cookie.includes("jss_session"), "register sets a session when email is skipped");
      assert(!(await prisma.pendingRegistration.findUnique({ where: { email } })), "pending row is consumed");
    }

    const verifyPage = await fetch(`${base}/conta/verificar-email?token=${encodeURIComponent(token)}`);
    const verifyHtml = await verifyPage.text();
    assert(verifyPage.ok, `verify page is reachable ${verifyPage.status}`);
    assert(
      verifyHtml.includes(token) || verifyHtml.includes("verificar-email") || verifyHtml.includes("VerifyEmail"),
      "verify page renders the clickable confirmation flow"
    );

    assert(cookie.includes("jss_session"), "signup ends with a session");

    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername: email, password: "surflegend1" }),
    });
    const loginBody = await login.json().catch(() => ({}));
    assert(login.ok, `login after register failed ${login.status} ${JSON.stringify(loginBody)}`);
    cookie = login.headers.get("set-cookie") || cookie;
    assert(cookie.includes("jss_session"), "login sets a session");

    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    assert(user?.emailVerifiedAt, "account is verified");
    assert(user.profile?.marketingOptIn === true, "verified account keeps marketing opt-in");
    const welcomeBefore = await prisma.emailEvent.count({
      where: { userId: user.id, type: "WELCOME_CUSTOMER" },
    });
    assert(welcomeBefore === 0, "welcome email waits until the profile is filled");

    const missingPhone = await fetch(`${base}/api/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie.split(";")[0] },
      body: JSON.stringify({
        fullName: "Ana Flow",
        customerType: "SURFER",
        preferredLanguage: "en",
        country: "PT",
        billingSameAsShipping: true,
      }),
    });
    assert(!missingPhone.ok, "profile save without phone is rejected");

    const phoneOnly = await fetch(`${base}/api/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie.split(";")[0] },
      body: JSON.stringify({
        fullName: "Ana Flow",
        phoneCountryCode: "+351",
        phone: "912345678",
        customerType: "SURFER",
        preferredLanguage: "en",
        country: "PT",
        billingSameAsShipping: true,
      }),
    });
    assert(phoneOnly.ok, `profile save with phone failed ${phoneOnly.status}`);
    assert(
      (await prisma.emailEvent.count({ where: { userId: user.id, type: "WELCOME_CUSTOMER" } })) === 0,
      "welcome still waits for address"
    );

    const complete = await fetch(`${base}/api/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie.split(";")[0] },
      body: JSON.stringify({
        fullName: "Ana Flow",
        phoneCountryCode: "+351",
        phone: "912345678",
        customerType: "SURFER",
        preferredLanguage: "en",
        country: "PT",
        addressLine1: "Rua da Praia 1",
        postalCode: "2775-236",
        city: "Carcavelos",
        billingSameAsShipping: true,
        marketingOptIn: true,
      }),
    });
    assert(complete.ok, `complete profile save failed ${complete.status} ${await complete.text()}`);

    const welcomeEmail = await prisma.emailEvent.findFirst({
      where: { userId: user.id, type: "WELCOME_CUSTOMER" },
    });
    const welcomeSms = await prisma.smsEvent.findFirst({
      where: { userId: user.id, type: "WELCOME_CUSTOMER" },
    });
    assert(welcomeEmail, "welcome email event is recorded after the profile is complete");
    assert(welcomeSms, "welcome SMS event is recorded after the phone is saved");
    assert(["SENT", "SKIPPED"].includes(welcomeEmail.status), "welcome email is sent or skipped when SMTP is blank");
    assert(["SENT", "SKIPPED"].includes(welcomeSms.status), "welcome SMS is sent or skipped when Twilio is blank");

    const optOutEmail = `flow-out-${stamp}@example.com`;
    const optOutUsername = `flowout${stamp}`.slice(0, 32);
    const optOutToken = randomToken(32);
    const optOutRegister = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({
        email: optOutEmail,
        username: optOutUsername,
        password: "surflegend1",
        marketingOptIn: false,
      }),
    });
    assert(optOutRegister.ok, "register with marketing unselected works");
    const optOutPending = await prisma.pendingRegistration.findUnique({ where: { email: optOutEmail } });
    if (optOutPending) {
      assert(optOutPending.marketingOptIn === false, "unselected marketing is stored on pending signup");
      await prisma.pendingRegistration.update({
        where: { id: optOutPending.id },
        data: { tokenHash: hashToken(optOutToken) },
      });
      const optOutVerify = await fetch(`${base}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: optOutToken }),
      });
      assert(optOutVerify.ok, "opt-out verify works");
    }
    const optOutUser = await prisma.user.findUnique({
      where: { email: optOutEmail },
      include: { profile: true },
    });
    assert(optOutUser?.profile?.marketingOptIn === false, "unselected marketing is kept after register");
    await prisma.emailEvent.deleteMany({ where: { userId: optOutUser.id } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: optOutUser.id } });
    await prisma.customerProfile.deleteMany({ where: { userId: optOutUser.id } });
    await prisma.user.delete({ where: { id: optOutUser.id } });
    await prisma.pendingRegistration.deleteMany({ where: { email: optOutEmail } });

    const linkEmail = `flow-link-${stamp}@example.com`;
    const linkUsername = `flowlink${stamp}`.slice(0, 32);
    const linkToken = randomToken(32);
    await prisma.pendingRegistration.create({
      data: {
        email: linkEmail,
        username: linkUsername,
        passwordHash: user.passwordHash || "",
        tokenHash: hashToken(linkToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        marketingOptIn: true,
      },
    });
    const linkVerify = await fetch(`${base}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: linkToken }),
    });
    assert(linkVerify.ok, `email-link verify failed ${linkVerify.status} ${await linkVerify.text()}`);
    assert((await prisma.user.findUnique({ where: { email: linkEmail } }))?.emailVerifiedAt, "email link still creates the user");

    const leftoverPendingEmail = `flow-pend-${stamp}@example.com`;
    await prisma.pendingRegistration.create({
      data: {
        email: leftoverPendingEmail,
        username: `flowpend${stamp}`.slice(0, 32),
        passwordHash: user.passwordHash || "",
        tokenHash: hashToken(randomToken(32)),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const pendingLogin = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername: leftoverPendingEmail, password: "surflegend1" }),
    });
    const pendingLoginBody = await pendingLogin.json().catch(() => ({}));
    assert(pendingLogin.ok, `pending login failed ${pendingLogin.status} ${JSON.stringify(pendingLoginBody)}`);
    assert(await prisma.user.findUnique({ where: { email: leftoverPendingEmail } }), "login completes leftover pending signup");

    for (const extraEmail of [linkEmail, leftoverPendingEmail]) {
      const extra = await prisma.user.findUnique({ where: { email: extraEmail } });
      if (extra) {
        await prisma.emailEvent.deleteMany({ where: { userId: extra.id } });
        await prisma.emailVerificationToken.deleteMany({ where: { userId: extra.id } });
        await prisma.customerProfile.deleteMany({ where: { userId: extra.id } });
        await prisma.user.delete({ where: { id: extra.id } });
      }
      await prisma.pendingRegistration.deleteMany({ where: { email: extraEmail } });
    }

    const spin = await fetch(`${base}/api/wheel/spin`, {
      method: "POST",
      headers: { Cookie: cookie.split(";")[0] },
    });
    const spinBody = await spin.json().catch(() => ({}));
    assert(spin.ok, `wheel spin failed ${spin.status} ${JSON.stringify(spinBody)}`);
    const wheelEmail = await prisma.emailEvent.findFirst({
      where: { userId: user.id, type: "WHEEL_PRIZE" },
    });
    assert(wheelEmail, "spinning the wheel records a prize email");

    await prisma.user.update({
      where: { id: user.id },
      data: { profile: { update: { marketingOptIn: true } } },
    });
    await prisma.wheelSpin.deleteMany({ where: { userId: user.id } });
    const reminder = await fetch(`${base}/api/cron/wheel-reminders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET || ""}` },
    });
    const reminderBody = await reminder.json().catch(() => ({}));
    assert(reminder.ok, `wheel reminder cron failed ${reminder.status} ${JSON.stringify(reminderBody)}`);
    assert(
      await prisma.emailEvent.findFirst({ where: { userId: user.id, type: "WHEEL_REMINDER" } }),
      "monthly wheel reminder email is recorded"
    );

    const product = await prisma.product.findFirst({ where: { active: true } });
    const order = await prisma.order.create({
      data: {
        orderNumber: `JSS-FLOW-${stamp}`,
        userId: user.id,
        status: "PENDING_PAYMENT",
        customerEmail: email,
        customerName: "Ana Flow",
        customerPhoneCountryCode: "+351",
        customerPhone: "912345678",
        subtotalCents: 5000,
        totalCents: 5000,
        items: {
          create: {
            name: product?.name || "Wax",
            quantity: 1,
            unitPriceCents: 5000,
            totalCents: 5000,
          },
        },
        payments: {
          create: {
            provider: "MANUAL",
            method: "MANUAL",
            status: "PENDING",
            amountCents: 5000,
            providerReference: `manual-flow-${stamp}`,
          },
        },
      },
    });

    const { markPaymentPaid } = await import("../src/lib/ecommerce/payments");
    await markPaymentPaid(`manual-flow-${stamp}`);
    assert(
      await prisma.emailEvent.findFirst({ where: { orderId: order.id, type: "PAYMENT_CONFIRMED" } }),
      "paid-order email event exists"
    );
    assert(
      await prisma.smsEvent.findFirst({ where: { orderId: order.id, type: "ORDER_PAID_CUSTOMER" } }),
      "paid-order SMS event exists"
    );

    console.log("registry-flow-http: verify, welcome-after-profile, wheel and paid-order notifications passed");
  } finally {
    const leftover = await prisma.user.findUnique({ where: { email } });
    if (leftover) {
      await prisma.smsEvent.deleteMany({ where: { userId: leftover.id } });
      await prisma.emailEvent.deleteMany({ where: { userId: leftover.id } });
      await prisma.emailVerificationToken.deleteMany({ where: { userId: leftover.id } });
      await prisma.wheelSpin.deleteMany({ where: { userId: leftover.id } });
      await prisma.order.deleteMany({ where: { userId: leftover.id } });
      await prisma.customerProfile.deleteMany({ where: { userId: leftover.id } }).catch(() => null);
      await prisma.user.delete({ where: { id: leftover.id } }).catch(() => null);
    }
    await prisma.pendingRegistration.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
