import {
  emailAddressOnly,
  parseEmailAddress,
  resolveTransactionalFrom,
  smtpDeliveryStatus,
} from "../src/lib/ecommerce/emailFrom";

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

console.log("email from/delivery checks passed");
