export type EmailFromInput = {
  emailFrom?: string | null;
  smtpUser?: string | null;
  fallbackDisplayName?: string;
  fallbackAddress?: string;
};

export type ParsedEmailAddress = {
  name: string;
  address: string;
};

const DEFAULT_DISPLAY_NAME = "Jhonny Surf Store";
const DEFAULT_ADDRESS = "orders@jhonnysurfstore.com";

export function parseEmailAddress(raw: string): ParsedEmailAddress {
  const trimmed = raw.trim();
  const angled = trimmed.match(/^(.*)<([^>]+)>\s*$/);
  if (angled) {
    return {
      name: angled[1].trim().replace(/^["']|["']$/g, ""),
      address: angled[2].trim(),
    };
  }
  return { name: "", address: trimmed };
}

export function emailAddressOnly(raw: string): string {
  return parseEmailAddress(raw).address.toLowerCase();
}

function domainOf(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "";
}

function formatFrom(name: string, address: string): string {
  if (!name) return address;
  return `${name} <${address}>`;
}

/**
 * Gmail SMTP will accept a custom From, but iCloud/Outlook often drop the
 * message when the domain does not match SMTP_USER. Keep the shop name and
 * send as the authenticated mailbox instead.
 */
export function resolveTransactionalFrom(input: EmailFromInput): string {
  const fallbackName = input.fallbackDisplayName?.trim() || DEFAULT_DISPLAY_NAME;
  const fallbackAddress = input.fallbackAddress?.trim() || DEFAULT_ADDRESS;
  const smtpUser = input.smtpUser?.trim() || "";
  const configured = input.emailFrom?.trim() || "";

  if (!configured) {
    return formatFrom(fallbackName, smtpUser || fallbackAddress);
  }

  const parsed = parseEmailAddress(configured);
  const name = parsed.name || fallbackName;
  const address = parsed.address || fallbackAddress;
  if (smtpUser && domainOf(address) && domainOf(smtpUser) && domainOf(address) !== domainOf(smtpUser)) {
    return formatFrom(name, smtpUser);
  }
  return formatFrom(name === fallbackName && !parsed.name ? fallbackName : name, address);
}

function recipientList(value: unknown): string[] {
  if (!value) return [];
  const items = Array.isArray(value) ? value : [value];
  return items
    .map((item) => {
      if (typeof item === "string") return item.trim().toLowerCase();
      if (item && typeof item === "object" && "address" in item) {
        return String((item as { address?: string }).address || "")
          .trim()
          .toLowerCase();
      }
      return "";
    })
    .filter(Boolean);
}

export function smtpDeliveryStatus(result: {
  accepted?: unknown;
  rejected?: unknown;
  pending?: unknown;
}): { ok: boolean; error: string | null } {
  const rejected = recipientList(result.rejected);
  const pending = recipientList(result.pending);
  if (rejected.length || pending.length) {
    return { ok: false, error: `smtp_rejected:${[...rejected, ...pending].join(",")}` };
  }
  const accepted = recipientList(result.accepted);
  if (accepted.length === 0) {
    return { ok: false, error: "smtp_rejected:no_accepted_recipients" };
  }
  return { ok: true, error: null };
}
