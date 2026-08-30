import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { currentPeriodKey } from "../src/lib/ecommerce/prizeWheel";

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
    assert(registerBody.pending === true, "register waits for the email link");

    const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
    assert(pending, "pending registration exists");
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
    const cookie = first.headers.get("set-cookie") || "";
    assert(cookie.includes("jss_session"), "verify sets a session");

    const second = await fetch(`${base}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    assert(second.ok, "the same verify link still works the second time");

    const user = await prisma.user.findUnique({ where: { email } });
    assert(user?.emailVerifiedAt, "account is verified");
    const welcomeBefore = await prisma.emailEvent.count({
      where: { userId: user.id, type: "WELCOME_CUSTOMER" },
    });
    assert(welcomeBefore === 0, "welcome email waits until the profile is filled");

    const incomplete = await fetch(`${base}/api/profile`, {
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
    assert(incomplete.ok, `incomplete profile save failed ${incomplete.status}`);
    assert(
      (await prisma.emailEvent.count({ where: { userId: user.id, type: "WELCOME_CUSTOMER" } })) === 0,
      "welcome still waits for phone and address"
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
    const reminder = await fetch(`${base}/api/cron/wheel-reminders`, { method: "POST" });
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
        status: "PAID",
        customerEmail: email,
        customerName: "Ana Flow",
        customerPhoneCountryCode: "+351",
        customerPhone: "912345678",
        subtotalCents: 5000,
        totalCents: 5000,
        paidAt: new Date(),
        items: {
          create: {
            productId: product?.id,
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
            status: "PAID",
            amountCents: 5000,
            paidAt: new Date(),
          },
        },
      },
    });

    const { sendPaymentConfirmedEmails } = await import("../src/lib/ecommerce/email");
    const { sendPaymentConfirmedSms } = await import("../src/lib/ecommerce/sms");
    const paidEmail = await sendPaymentConfirmedEmails(order.id);
    assert(!paidEmail.skipped || paidEmail.reason !== "missing_odoo_fatura_pdf", "paid email is not blocked by a missing fatura");
    await sendPaymentConfirmedSms(order.id);
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
