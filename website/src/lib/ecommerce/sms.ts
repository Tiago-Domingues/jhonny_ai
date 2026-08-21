import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import {
  customerPaidSmsBody,
  jhonnySmsPhone,
  ownerPaidSmsBody,
} from "@/lib/ecommerce/smsMessages";

type SendSmsResult = {
  status: "SENT" | "FAILED" | "SKIPPED";
  provider: string;
  providerId: string | null;
  error: string | null;
};

export function toE164(phoneCountryCode: string, phone: string) {
  const code = phoneCountryCode.replace(/[^\d+]/g, "");
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const normalizedCode = code.startsWith("+") ? code : `+${code}`;
  // Avoid duplicating country code if the user already typed it into the phone field.
  if (digits.startsWith(normalizedCode.replace(/\D/g, ""))) {
    return `+${digits}`;
  }
  return `${normalizedCode}${digits}`;
}

async function sendTwilioSms(to: string, body: string): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    return {
      status: "SKIPPED",
      provider: "twilio",
      providerId: null,
      error: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER is not configured.",
    };
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      }
    );
    const data = (await response.json().catch(() => null)) as
      | { sid?: string; message?: string; error_message?: string }
      | null;

    if (!response.ok) {
      return {
        status: "FAILED",
        provider: "twilio",
        providerId: null,
        error: data?.message || data?.error_message || `Twilio HTTP ${response.status}`,
      };
    }

    return {
      status: "SENT",
      provider: "twilio",
      providerId: data?.sid || null,
      error: null,
    };
  } catch (error) {
    return {
      status: "FAILED",
      provider: "twilio",
      providerId: null,
      error: error instanceof Error ? error.message : "Twilio SMS send failed.",
    };
  }
}

export async function sendWelcomeSms(input: {
  userId: string;
  fullName?: string | null;
  phoneCountryCode?: string | null;
  phone?: string | null;
}) {
  const to = input.phoneCountryCode && input.phone ? toE164(input.phoneCountryCode, input.phone) : null;
  const firstName = (input.fullName || "Legend").trim().split(/\s+/)[0] || "Legend";
  const body = `Hi ${firstName}! Welcome to the Jhonny family. Your account is ready — see you in the water. Jhonny Surf Store`;

  if (!to) {
    return prisma.smsEvent.create({
      data: {
        userId: input.userId,
        type: "WELCOME_CUSTOMER",
        status: "SKIPPED",
        recipientPhone: "",
        body,
        provider: "twilio",
        error: "Phone number missing.",
      },
    });
  }

  const result = await sendTwilioSms(to, body);
  return prisma.smsEvent.create({
    data: {
      userId: input.userId,
      type: "WELCOME_CUSTOMER",
      status: result.status,
      recipientPhone: to,
      body,
      provider: result.provider,
      providerId: result.providerId,
      error: result.error,
      sentAt: result.status === "SENT" ? new Date() : null,
    },
  });
}

async function recordSmsEvent(input: {
  userId?: string | null;
  orderId?: string | null;
  type: string;
  to: string | null;
  body: string;
  skipError?: string;
}) {
  if (!input.to) {
    return prisma.smsEvent.create({
      data: {
        userId: input.userId ?? undefined,
        orderId: input.orderId ?? undefined,
        type: input.type,
        status: "SKIPPED",
        recipientPhone: "",
        body: input.body,
        provider: "twilio",
        error: input.skipError || "Phone number missing.",
      },
    });
  }

  const result = await sendTwilioSms(input.to, input.body);
  return prisma.smsEvent.create({
    data: {
      userId: input.userId ?? undefined,
      orderId: input.orderId ?? undefined,
      type: input.type,
      status: result.status,
      recipientPhone: input.to,
      body: input.body,
      provider: result.provider,
      providerId: result.providerId,
      error: result.error,
      sentAt: result.status === "SENT" ? new Date() : null,
    },
  });
}

export async function sendPaymentConfirmedSms(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) return;

  const payment = order.payments.find((entry) => entry.status === "PAID") || order.payments[0];
  const paidAt = order.paidAt || payment?.paidAt || new Date();
  const customerTo =
    order.customerPhoneCountryCode && order.customerPhone
      ? toE164(order.customerPhoneCountryCode, order.customerPhone)
      : null;
  const customerBody = customerPaidSmsBody(order.orderNumber, order.totalCents);

  await recordSmsEvent({
    userId: order.userId,
    orderId: order.id,
    type: "ORDER_PAID_CUSTOMER",
    to: customerTo,
    body: customerBody,
    skipError: "Phone number missing.",
  });

  const ownerTo = jhonnySmsPhone() || null;
  const ownerBody = ownerPaidSmsBody({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: customerTo || order.customerPhone,
    totalCents: order.totalCents,
    paidAt,
    paymentMethod: payment?.method ?? null,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      totalCents: item.totalCents,
    })),
  });

  await recordSmsEvent({
    userId: order.userId,
    orderId: order.id,
    type: "ORDER_PAID_OWNER",
    to: ownerTo,
    body: ownerBody,
    skipError: "JHONNY_SMS_PHONE is not configured.",
  });
}
