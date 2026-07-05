import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { centsToEuros } from "@/lib/ecommerce/money";
import { finalizeOdooOrderAfterPayment } from "@/lib/ecommerce/odooOrders";

type PaymentRequest = {
  method: "MBWAY" | "MULTIBANCO" | "PAYPAL" | "KLARNA" | "CARD" | "MANUAL";
  amountCents: number;
  currency: string;
  email: string;
  phone?: string;
  mbwayPhone?: string;
  description: string;
};

type ProviderResult = {
  provider: "IFTHENPAY" | "PAYPAL" | "KLARNA" | "MANUAL";
  status: "PENDING" | "REQUIRES_ACTION";
  providerReference?: string;
  providerRequestId?: string;
  providerPaymentUrl?: string;
  multibancoEntity?: string;
  multibancoReference?: string;
  mbwayPhone?: string;
  rawProviderPayload?: unknown;
};

function amountString(cents: number) {
  return centsToEuros(cents).toFixed(2);
}

function normalizeMbwayPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("351") && digits.length > 3) {
    return `351#${digits.slice(3)}`;
  }
  return `351#${digits}`;
}

async function createIfthenpayMbwayPayment(orderNumber: string, request: PaymentRequest): Promise<ProviderResult> {
  const key = process.env.IFTHENPAY_MBWAY_KEY;
  const phone = request.mbwayPhone || request.phone;
  if (!key || !phone) {
    return {
      provider: "IFTHENPAY",
      status: "PENDING",
      providerReference: `mock-mbway-${orderNumber}`,
      mbwayPhone: phone,
      rawProviderPayload: { mode: "mock", reason: "missing_ifthenpay_mbway_key_or_phone" },
    };
  }

  const response = await fetch("https://api.ifthenpay.com/spg/payment/mbway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mbWayKey: key,
      orderId: orderNumber.slice(0, 15),
      amount: amountString(request.amountCents),
      mobileNumber: normalizeMbwayPhone(phone),
      email: request.email,
      description: request.description.slice(0, 50),
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error("Ifthenpay MB WAY request failed.");
  }

  return {
    provider: "IFTHENPAY",
    status: "PENDING",
    providerReference: String(payload.orderId || orderNumber),
    providerRequestId: payload.RequestId || payload.requestId,
    mbwayPhone: phone,
    rawProviderPayload: payload,
  };
}

async function createIfthenpayMultibancoPayment(orderNumber: string, request: PaymentRequest): Promise<ProviderResult> {
  const key = process.env.IFTHENPAY_MB_KEY;
  if (!key) {
    return {
      provider: "IFTHENPAY",
      status: "PENDING",
      providerReference: `mock-mb-${orderNumber}`,
      multibancoEntity: "00000",
      multibancoReference: "000 000 000",
      rawProviderPayload: { mode: "mock", reason: "missing_ifthenpay_mb_key" },
    };
  }

  const response = await fetch("https://api.ifthenpay.com/spg/payment/multibanco", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mbKey: key,
      orderId: orderNumber.slice(0, 15),
      amount: amountString(request.amountCents),
      description: request.description.slice(0, 50),
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error("Ifthenpay Multibanco request failed.");
  }

  return {
    provider: "IFTHENPAY",
    status: "PENDING",
    providerReference: String(payload.orderId || orderNumber),
    providerRequestId: payload.RequestId || payload.requestId || payload.transactionId,
    multibancoEntity: payload.Entity || payload.entity,
    multibancoReference: payload.Reference || payload.reference,
    rawProviderPayload: payload,
  };
}

async function createProviderPayment(orderNumber: string, request: PaymentRequest): Promise<ProviderResult> {
  if (request.method === "MBWAY") return createIfthenpayMbwayPayment(orderNumber, request);
  if (request.method === "MULTIBANCO") return createIfthenpayMultibancoPayment(orderNumber, request);
  if (request.method === "PAYPAL") {
    return {
      provider: "PAYPAL",
      status: "REQUIRES_ACTION",
      providerReference: `paypal-pending-${orderNumber}`,
      rawProviderPayload: { mode: "placeholder", reason: "paypal_credentials_not_connected" },
    };
  }
  if (request.method === "KLARNA") {
    return {
      provider: "KLARNA",
      status: "REQUIRES_ACTION",
      providerReference: `klarna-pending-${orderNumber}`,
      rawProviderPayload: { mode: "placeholder", reason: "klarna_credentials_not_connected" },
    };
  }
  return {
    provider: "MANUAL",
    status: "PENDING",
    providerReference: `manual-${orderNumber}`,
  };
}

export async function createPaymentForOrder(orderId: string, request: PaymentRequest) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const providerResult = await createProviderPayment(order.orderNumber, request);

  return prisma.payment.create({
    data: {
      orderId,
      provider: providerResult.provider,
      method: request.method,
      status: providerResult.status,
      amountCents: request.amountCents,
      currency: request.currency,
      providerReference: providerResult.providerReference,
      providerRequestId: providerResult.providerRequestId,
      providerPaymentUrl: providerResult.providerPaymentUrl,
      multibancoEntity: providerResult.multibancoEntity,
      multibancoReference: providerResult.multibancoReference,
      mbwayPhone: providerResult.mbwayPhone,
      rawProviderPayload: providerResult.rawProviderPayload === undefined ? undefined : (providerResult.rawProviderPayload as object),
    },
  });
}

export async function markPaymentPaid(providerReference: string) {
  const payment = await prisma.payment.findFirst({
    where: { providerReference },
    include: { order: true },
  });
  if (!payment) return 0;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", paidAt: new Date() },
  });
  await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: "PAID", paidAt: new Date() },
  });
  await finalizeOdooOrderAfterPayment(payment.orderId);
  return 1;
}
