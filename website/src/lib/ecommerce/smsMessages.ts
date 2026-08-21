import { formatEuro } from "@/lib/ecommerce/money";

export const SMS_MAX_CHARS = 1400;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  MBWAY: "MB WAY",
  MULTIBANCO: "Multibanco",
  CARD: "Cartão",
  PAYPAL: "PayPal",
  KLARNA: "Klarna",
  GOOGLE_PAY: "Google Pay",
  APPLE_PAY: "Apple Pay",
  REVOLUT_PAY: "Revolut Pay",
  PIX: "Pix",
  PAYSHOP: "Payshop",
};

export function truncateSms(body: string, max = SMS_MAX_CHARS) {
  if (body.length <= max) return body;
  return `${body.slice(0, Math.max(0, max - 1))}…`;
}

export function formatPaidAtLisbon(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function customerPaidSmsBody(orderNumber: string, totalCents: number) {
  return `Jhonny Surf Store: pagamento confirmado. Encomenda ${orderNumber}. Total ${formatEuro(totalCents)}. Obrigado!`;
}

export function ownerPaidSmsBody(input: {
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  totalCents: number;
  paidAt: Date;
  paymentMethod?: string | null;
  items: Array<{ name: string; quantity: number; totalCents: number }>;
}) {
  const when = formatPaidAtLisbon(input.paidAt);
  const method = input.paymentMethod
    ? PAYMENT_METHOD_LABELS[input.paymentMethod] || input.paymentMethod
    : null;
  const lines = [
    `Nova venda ${when}`,
    `Encomenda ${input.orderNumber}`,
    `Nome: ${input.customerName.trim() || "—"}`,
  ];
  if (input.customerPhone) lines.push(`Tel: ${input.customerPhone}`);
  for (const item of input.items) {
    lines.push(`${item.quantity}x ${item.name} (${formatEuro(item.totalCents)})`);
  }
  lines.push(`Total ${formatEuro(input.totalCents)}`);
  if (method) lines.push(method);
  return truncateSms(lines.join("\n"));
}

export function jhonnySmsPhone() {
  return process.env.JHONNY_SMS_PHONE?.trim() || "";
}
