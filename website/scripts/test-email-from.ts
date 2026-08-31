import {
  emailAddressOnly,
  parseEmailAddress,
  resolveTransactionalFrom,
  smtpDeliveryStatus,
} from "../src/lib/ecommerce/emailFrom";
import {
  isTransactionalEmailConfigured,
  preferredEmailProvider,
  resendCredentialsConfigured,
  smtpCredentialsConfigured,
} from "../src/lib/ecommerce/emailConfig";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(parseEmailAddress("Jhonny Surf Store <orders@jhonnysurfstore.com>").name === "Jhonny Surf Store", "display name is parsed");
assert(
  parseEmailAddress("Jhonny Surf Store <orders@jhonnysurfstore.com>").address === "orders@jhonnysurfstore.com",
  "address is parsed"
);
assert(emailAddressOnly("Ana <ANA@Mac.com>") === "ana@mac.com", "address compare is case-insensitive");

assert(
  resolveTransactionalFrom({
    emailFrom: "Jhonny Surf Store <orders@jhonnysurfstore.com>",
    smtpUser: "jhonnysurfstore@gmail.com",
  }) === "Jhonny Surf Store <jhonnysurfstore@gmail.com>",
  "Gmail SMTP must send as the authenticated mailbox"
);

assert(
  resolveTransactionalFrom({
    emailFrom: "Jhonny Surf Store <jhonnysurfstore@gmail.com>",
    smtpUser: "jhonnysurfstore@gmail.com",
  }) === "Jhonny Surf Store <jhonnysurfstore@gmail.com>",
  "matching Gmail From is left unchanged"
);

assert(
  resolveTransactionalFrom({
    emailFrom: "",
    smtpUser: "jhonnysurfstore@gmail.com",
  }) === "Jhonny Surf Store <jhonnysurfstore@gmail.com>",
  "empty EMAIL_FROM falls back to SMTP_USER"
);

assert(
  resolveTransactionalFrom({
    emailFrom: "orders@jhonnysurfstore.com",
    smtpUser: "jhonnysurfstore@gmail.com",
  }) === "Jhonny Surf Store <jhonnysurfstore@gmail.com>",
  "bare shop-domain From is rewritten to the SMTP mailbox"
);

assert(
  resolveTransactionalFrom({
    emailFrom: "Jhonny Surf Store <orders@jhonnysurfstore.com>",
    smtpUser: null,
  }) === "Jhonny Surf Store <orders@jhonnysurfstore.com>",
  "Resend/custom From is kept when there is no SMTP user"
);

assert(smtpDeliveryStatus({ accepted: ["ana@mac.com"], rejected: [] }).ok, "accepted recipient is SENT");
assert(
  smtpDeliveryStatus({ accepted: [], rejected: ["ana@mac.com"] }).error === "smtp_rejected:ana@mac.com",
  "rejected recipient is FAILED"
);
assert(
  smtpDeliveryStatus({
    accepted: ["jhonnysurfstore@gmail.com"],
    rejected: [{ address: "ana@mac.com" }],
  }).ok === false,
  "partial reject is FAILED"
);
assert(smtpDeliveryStatus({ accepted: [], rejected: [], pending: [] }).ok === false, "no accepted recipients is FAILED");

assert(preferredEmailProvider({ EMAIL_PROVIDER: "" }) === "smtp", "blank EMAIL_PROVIDER prefers SMTP");
assert(preferredEmailProvider({ EMAIL_PROVIDER: "resend" }) === "resend", "EMAIL_PROVIDER=resend is honoured");
assert(
  !smtpCredentialsConfigured({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: "", SMTP_PASSWORD: "" }),
  "empty SMTP user/password is not configured"
);
assert(
  smtpCredentialsConfigured({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: "shop@gmail.com", SMTP_PASSWORD: "app-pass" }),
  "SMTP is configured when host, user and password are set"
);
assert(!resendCredentialsConfigured({ RESEND_API_KEY: "" }), "blank Resend key is not configured");
assert(resendCredentialsConfigured({ RESEND_API_KEY: "re_test" }), "Resend key counts as configured");
assert(
  isTransactionalEmailConfigured({ EMAIL_PROVIDER: "smtp", SMTP_HOST: "", RESEND_API_KEY: "re_test" }),
  "Resend still counts when SMTP is the preferred provider"
);
assert(
  !isTransactionalEmailConfigured({ EMAIL_PROVIDER: "smtp", SMTP_HOST: "", SMTP_USER: "", SMTP_PASSWORD: "", RESEND_API_KEY: "" }),
  "neither provider configured means mail is skipped"
);

console.log("email from/delivery checks passed");
