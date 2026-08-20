import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { sendPaymentConfirmedEmails } from "@/lib/ecommerce/email";
import { recordCouponUsageForPaidOrder } from "@/lib/ecommerce/coupons";
import { centsToEuros } from "@/lib/ecommerce/money";
import { finalizeOdooOrderAfterPayment } from "@/lib/ecommerce/odooOrders";
import {
  firstNonEmpty,
  ifthenpayOrderId,
  isIfthenpayGatewayAccepted,
  isPaidCallbackStatus,
  normalizePaymentReference,
} from "@/lib/ecommerce/ifthenpay";
import { isProductionRuntime } from "@/lib/ecommerce/securityRuntime";

type PaymentRequest = {
  method: "MBWAY" | "MULTIBANCO" | "PAYSHOP" | "PAYPAL" | "KLARNA" | "CARD" | "MANUAL";
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

function assertIfthenpayGatewayAccepted(payload: Record<string, unknown>, method: string) {
  const status = firstNonEmpty(payload.Status, payload.status, payload.Code, payload.code);
  if (isIfthenpayGatewayAccepted(status)) return;
  const message = firstNonEmpty(payload.Message, payload.message) || "unknown error";
  throw new Error(`${method} was rejected by Ifthenpay (${status}: ${message}).`);
}

async function readIfthenpayJson(response: Response, method: string) {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("<")) {
    throw new Error(
      `${method} is not available from Ifthenpay right now. Check the account key and try again.`
    );
  }
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    throw new Error(`${method} returned an invalid response from Ifthenpay.`);
  }
}

async function createIfthenpayMbwayPayment(orderNumber: string, request: PaymentRequest): Promise<ProviderResult> {
  const key = process.env.IFTHENPAY_MBWAY_KEY;
  const phone = request.mbwayPhone || request.phone;
  if (!key || !phone) {
    if (isProductionRuntime()) {
      throw new Error("MB WAY is not configured. Set IFTHENPAY_MBWAY_KEY (and a phone number) before checkout.");
    }
    return {
      provider: "IFTHENPAY",
      status: "PENDING",
      providerReference: `mock-mbway-${orderNumber}`,
      mbwayPhone: phone,
      rawProviderPayload: { mode: "mock", reason: "missing_ifthenpay_mbway_key_or_phone" },
    };
  }

  const orderId = ifthenpayOrderId(orderNumber);
  const response = await fetch("https://api.ifthenpay.com/spg/payment/mbway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mbWayKey: key,
      orderId,
      amount: amountString(request.amountCents),
      mobileNumber: normalizeMbwayPhone(phone),
      email: request.email,
      description: request.description.slice(0, 50),
    }),
  });
  const payload = await readIfthenpayJson(response, "MB WAY");
  if (!response.ok) {
    throw new Error("Ifthenpay MB WAY request failed.");
  }
  assertIfthenpayGatewayAccepted(payload, "MB WAY");

  return {
    provider: "IFTHENPAY",
    status: "PENDING",
    providerReference: firstNonEmpty(payload.orderId, payload.OrderId) || orderId,
    providerRequestId: firstNonEmpty(payload.RequestId, payload.requestId),
    mbwayPhone: phone,
    rawProviderPayload: payload,
  };
}

async function createIfthenpayMultibancoPayment(orderNumber: string, request: PaymentRequest): Promise<ProviderResult> {
  const key = process.env.IFTHENPAY_MB_KEY;
  if (!key) {
    if (isProductionRuntime()) {
      throw new Error("Multibanco is not configured. Set IFTHENPAY_MB_KEY before checkout.");
    }
    return {
      provider: "IFTHENPAY",
      status: "PENDING",
      providerReference: `mock-mb-${orderNumber}`,
      multibancoEntity: "00000",
      multibancoReference: "000 000 000",
      rawProviderPayload: { mode: "mock", reason: "missing_ifthenpay_mb_key" },
    };
  }

  const orderId = ifthenpayOrderId(orderNumber);
  const response = await fetch("https://api.ifthenpay.com/multibanco/reference/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mbKey: key,
      orderId,
      amount: amountString(request.amountCents),
      description: request.description.slice(0, 50),
    }),
  });
  const payload = await readIfthenpayJson(response, "Multibanco");
  if (!response.ok) {
    throw new Error("Ifthenpay Multibanco request failed.");
  }
  assertIfthenpayGatewayAccepted(payload, "Multibanco");
  const entity = firstNonEmpty(payload.Entity, payload.entity);
  const reference = firstNonEmpty(payload.Reference, payload.reference);

  return {
    provider: "IFTHENPAY",
    status: "PENDING",
    providerReference: firstNonEmpty(payload.orderId, payload.OrderId) || orderId,
    providerRequestId: firstNonEmpty(payload.RequestId, payload.requestId, payload.transactionId),
    multibancoEntity: entity,
    multibancoReference: reference ? normalizePaymentReference(reference) : undefined,
    rawProviderPayload: payload,
  };
}

async function createIfthenpayPayshopPayment(orderNumber: string, request: PaymentRequest): Promise<ProviderResult> {
  const key = process.env.IFTHENPAY_PAYSHOP_KEY;
  if (!key) {
    if (isProductionRuntime()) {
      throw new Error("Payshop is not configured. Set IFTHENPAY_PAYSHOP_KEY before checkout.");
    }
    return {
      provider: "IFTHENPAY",
      status: "PENDING",
      providerReference: `mock-payshop-${orderNumber}`,
      multibancoReference: "0000000000000",
      rawProviderPayload: { mode: "mock", reason: "missing_ifthenpay_payshop_key" },
    };
  }

  const orderId = ifthenpayOrderId(orderNumber, 25);
  const response = await fetch("https://api.ifthenpay.com/payshop/reference/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payshopkey: key,
      id: orderId,
      valor: amountString(request.amountCents),
      validade: "",
    }),
  });
  const payload = await readIfthenpayJson(response, "Payshop");
  if (!response.ok) {
    throw new Error("Ifthenpay Payshop request failed.");
  }
  assertIfthenpayGatewayAccepted(payload, "Payshop");
  const reference = firstNonEmpty(payload.Reference, payload.reference);

  return {
    provider: "IFTHENPAY",
    status: "PENDING",
    providerReference: firstNonEmpty(payload.id, payload.Id, payload.orderId, payload.OrderId) || orderId,
    providerRequestId: firstNonEmpty(payload.RequestId, payload.requestId),
    multibancoReference: reference ? normalizePaymentReference(reference) : undefined,
    rawProviderPayload: payload,
  };
}

async function createProviderPayment(orderNumber: string, request: PaymentRequest): Promise<ProviderResult> {
  if (request.method === "MBWAY") return createIfthenpayMbwayPayment(orderNumber, request);
  if (request.method === "MULTIBANCO") return createIfthenpayMultibancoPayment(orderNumber, request);
  if (request.method === "PAYSHOP") return createIfthenpayPayshopPayment(orderNumber, request);
  if (request.method === "PAYPAL") {
    if (isProductionRuntime()) {
      throw new Error("PayPal is not connected yet.");
    }
    return {
      provider: "PAYPAL",
      status: "REQUIRES_ACTION",
      providerReference: `paypal-pending-${orderNumber}`,
      rawProviderPayload: { mode: "placeholder", reason: "paypal_credentials_not_connected" },
    };
  }
  if (request.method === "KLARNA") {
    if (isProductionRuntime()) {
      throw new Error("Klarna is not connected yet.");
    }
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

export async function markPaymentPaid(
  providerReference: string,
  options?: { amountCents?: number | null; status?: string | null }
) {
  const reference = providerReference.trim();
  const compactReference = normalizePaymentReference(reference);
  const payment =
    (await prisma.payment.findFirst({
      where: { providerReference: reference },
      include: { order: true },
    })) ||
    (await prisma.payment.findFirst({
      where: { providerRequestId: reference },
      include: { order: true },
    })) ||
    (await prisma.payment.findFirst({
      where: {
        OR: [
          { multibancoReference: reference },
          { multibancoReference: compactReference },
        ],
      },
      include: { order: true },
    }));
  if (!payment) return 0;
  if (payment.status === "PAID") return 1;

  if (!isPaidCallbackStatus(options?.status)) {
    throw new Error("invalid_payment_status");
  }

  if (options?.amountCents != null && Number.isFinite(options.amountCents)) {
    if (Math.round(options.amountCents) !== payment.amountCents) {
      throw new Error("amount_mismatch");
    }
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", paidAt: new Date() },
  });
  await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: "PAID", paidAt: new Date() },
  });

  try {
    await recordCouponUsageForPaidOrder(payment.orderId);
  } catch {
    // Payment already succeeded; coupon accounting can be retried from the paid order.
  }

  try {
    await finalizeOdooOrderAfterPayment(payment.orderId);
  } catch {
    // Payment is already marked paid; Odoo sync can be retried separately.
  }

  try {
    await sendPaymentConfirmedEmails(payment.orderId);
  } catch {
    // Never roll back payment because of email failures.
  }

  return 1;
}
