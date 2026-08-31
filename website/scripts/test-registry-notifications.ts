import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isProfileReadyForWelcome } from "../src/lib/ecommerce/profileReady";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(
  !isProfileReadyForWelcome({ fullName: "Ana", phone: "", addressLine1: "Rua 1", city: "Lisboa", postalCode: "1000-001" }),
  "welcome waits for a phone number"
);
assert(
  !isProfileReadyForWelcome({ fullName: "Ana", phone: "912345678", addressLine1: "", city: "Lisboa", postalCode: "1000-001" }),
  "welcome waits for an address"
);
assert(
  isProfileReadyForWelcome({
    fullName: "Ana Silva",
    phone: "912345678",
    addressLine1: "Rua da Praia 1",
    city: "Carcavelos",
    postalCode: "2775-236",
  }),
  "welcome is ready after name, phone and address"
);

const verifyClient = readFileSync(resolve(__dirname, "../src/components/VerifyEmailClient.tsx"), "utf8");
assert(verifyClient.includes("started.current"), "verify page posts the token only once");
assert(/locale copy must not retrigger/i.test(verifyClient), "locale changes must not resend the token");

const verifyEmail = readFileSync(resolve(__dirname, "../src/lib/ecommerce/email.ts"), "utf8");
assert(verifyEmail.includes("word-break:break-all"), "verification email includes a pasteable URL");
assert(verifyEmail.includes("WHEEL_PRIZE"), "wheel prize email exists");
assert(verifyEmail.includes("WHEEL_REMINDER"), "monthly wheel reminder email exists");
assert(verifyEmail.includes("sendResendEmail"), "SMTP can fall back to Resend");
assert(!verifyEmail.includes("missing_odoo_fatura_pdf"), "paid emails still send without an Odoo PDF");

const verifyFlow = readFileSync(resolve(__dirname, "../src/lib/ecommerce/emailVerification.ts"), "utf8");
assert(verifyFlow.includes('event.status === "SENT"'), "signup waits for the link only when email is SENT");
assert(verifyFlow.includes("createUserFromPending"), "signup creates the account when email is not sent");
assert(verifyFlow.includes("completePendingRegistrationWithPassword"), "login completes a pending signup when email is not sent");

const profileRoute = readFileSync(resolve(__dirname, "../src/app/api/profile/route.ts"), "utf8");
assert(profileRoute.includes("sendWelcomeNotificationsIfProfileReady"), "welcome email/SMS fire after the profile is saved");

const verifyRoute = readFileSync(resolve(__dirname, "../src/app/api/auth/verify-email/route.ts"), "utf8");
assert(!verifyRoute.includes("sendWelcomeEmail"), "verify link no longer sends welcome before the profile exists");

const wheelSpins = readFileSync(resolve(__dirname, "../src/lib/ecommerce/wheelSpins.ts"), "utf8");
assert(wheelSpins.includes("sendWheelPrizeEmail"), "spinning the wheel sends the prize email");

const vercel = readFileSync(resolve(__dirname, "../vercel.json"), "utf8");
assert(vercel.includes("/api/cron/wheel-reminders"), "monthly wheel reminder cron is scheduled");

const proxy = readFileSync(resolve(__dirname, "../src/proxy.ts"), "utf8");
assert(proxy.includes("isPublicEmailAuthPath"), "coming-soon proxy lets email auth links through");

const payments = readFileSync(resolve(__dirname, "../src/lib/ecommerce/payments.ts"), "utf8");
assert(payments.includes("sendPaymentConfirmedEmails"), "purchase flow sends confirmation emails");
assert(payments.includes("sendPaymentConfirmedSms"), "purchase flow sends confirmation SMS");
assert(!/if \(invoiceReady\)/.test(payments), "paid emails are not gated on an Odoo fatura");

console.log("registry-notifications: verify link, welcome-after-profile, wheel and purchase hooks ok");
