import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { sendPaymentConfirmedEmails } from "@/lib/ecommerce/email";
import { sendPaymentConfirmedSms } from "@/lib/ecommerce/sms";
import { recordCouponUsageForPaidOrder } from "@/lib/ecommerce/coupons";
import { centsToEuros } from "@/lib/ecommerce/money";
import { finalizeOdooOrderAfterPayment, decrementLocalStockForPaidOrder } from "@/lib/ecommerce/odooOrders";
import { isProductionRuntime } from "@/lib/ecommerce/securityRuntime";
import { getStripe, stripePaymentMethodConfiguration } from "@/lib/ecommerce/stripe";
import {
  hasStripeSecret,
  resolveCheckoutOrigin,
  stripeLineItems,
  stripePaymentMethodTypes,
} from "@/lib/ecommerce/stripeCheckout";
import { isStripeCheckoutMethod } from "@/lib/ecommerce/paymentMethods";

type PaymentRequest = {
  method:
    | "MBWAY"
    | "MULTIBANCO"
    | "PAYPAL"
    | "KLARNA"
    | "CARD"
    | "MANUAL"
    | "PAYSHOP"
    | "GOOGLE_PAY"
    | "APPLE_PAY"
    | "REVOLUT_PAY"
    | "PIX";
  amountCents: number;
  currency: string;
  email: string;
  phone?: string;
  mbwayPhone?: string;
  description: string;
  customerName?: string;
  fulfillmentMethod?: "PICKUP_IN_STORE" | "SHIP_TO_ADDRESS";
  shippingCountry?: string;
  returnOrigin?: string;
  requestOrigin?: string;
};

type ProviderResult = {
  provider: "IFTHENPAY" | "PAYPAL" | "KLARNA" | "STRIPE" | "MANUAL";
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
    providerReference: String(payload.orderId || orderNumber.slice(0, 15)),
    providerRequestId: payload.RequestId || payload.requestId,
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
    providerReference: String(payload.orderId || orderNumber.slice(0, 15)),
    providerRequestId: payload.RequestId || payload.requestId || payload.transactionId,
    multibancoEntity: payload.Entity || payload.entity,
    multibancoReference: payload.Reference || payload.reference,
    rawProviderPayload: payload,
  };
}

async function createStripeCheckoutPayment(
  order: {
    id: string;
    orderNumber: string;
    totalCents: number;
    shippingCents: number;
    discountCents: number;
    currency: string;
    customerName: string;
    fulfillmentMethod: "PICKUP_IN_STORE" | "SHIP_TO_ADDRESS";
    items: Array<{ name: string; quantity: number; totalCents: number }>;
  },
  request: PaymentRequest
): Promise<ProviderResult> {
  if (!hasStripeSecret()) {
    if (isProductionRuntime()) {
      throw new Error("Stripe is not connected yet. Set STRIPE_SECRET_KEY.");
    }
    return {
      provider: "STRIPE",
      status: "REQUIRES_ACTION",
      providerReference: `stripe-pending-${order.orderNumber}`,
      rawProviderPayload: { mode: "placeholder", reason: "stripe_credentials_not_connected" },
    };
  }

  const origin = resolveCheckoutOrigin(request.returnOrigin, request.requestOrigin);
  const lineItems = stripeLineItems({
    items: order.items,
    shippingCents: order.shippingCents,
    discountCents: order.discountCents,
    currency: order.currency,
  });
  const paymentMethodConfiguration = stripePaymentMethodConfiguration();
  const paymentMethodTypes = stripePaymentMethodTypes(request.method);
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: request.email,
    client_reference_id: order.orderNumber,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: request.method,
    },
    payment_intent_data: {
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: request.method,
      },
      description: request.description.slice(0, 1000),
    },
    line_items: lineItems,
    success_url: `${origin}/checkout/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?canceled=1`,
    locale: "auto",
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    ...(order.fulfillmentMethod === "SHIP_TO_ADDRESS"
      ? {
          shipping_address_collection: {
            allowed_countries: [
              "PT",
              "ES",
              "FR",
              "DE",
              "GB",
              "IE",
              "IT",
              "NL",
              "BE",
              "AT",
              "CH",
              "LU",
              "US",
              "BR",
            ],
          },
        }
      : {}),
    ...(paymentMethodTypes ? { payment_method_types: paymentMethodTypes } : {}),
    ...(!paymentMethodTypes && paymentMethodConfiguration
      ? { payment_method_configuration: paymentMethodConfiguration }
      : {}),
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return {
    provider: "STRIPE",
    status: "REQUIRES_ACTION",
    providerReference: session.id,
    providerRequestId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    providerPaymentUrl: session.url,
    rawProviderPayload: { id: session.id, mode: session.mode, url: session.url },
  };
}

async function createProviderPayment(
  order: {
    id: string;
    orderNumber: string;
    totalCents: number;
    shippingCents: number;
    discountCents: number;
    currency: string;
    customerName: string;
    fulfillmentMethod: "PICKUP_IN_STORE" | "SHIP_TO_ADDRESS";
    items: Array<{ name: string; quantity: number; totalCents: number }>;
  },
  request: PaymentRequest
): Promise<ProviderResult> {
  if (request.method === "MBWAY") return createIfthenpayMbwayPayment(order.orderNumber, request);
  if (request.method === "MULTIBANCO") return createIfthenpayMultibancoPayment(order.orderNumber, request);
  if (request.method === "PAYSHOP") {
    if (isProductionRuntime()) {
      throw new Error("PAYSHOP is not connected yet.");
    }
    return {
      provider: "MANUAL",
      status: "REQUIRES_ACTION",
      providerReference: `payshop-pending-${order.orderNumber}`,
      rawProviderPayload: { mode: "placeholder", reason: "payshop_not_connected" },
    };
  }
  if (isStripeCheckoutMethod(request.method)) {
    return createStripeCheckoutPayment(order, request);
  }
  return {
    provider: "MANUAL",
    status: "PENDING",
    providerReference: `manual-${order.orderNumber}`,
  };
}

export async function createPaymentForOrder(orderId: string, request: PaymentRequest) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });
  const providerResult = await createProviderPayment(order, request);

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
  const payment =
    (await prisma.payment.findFirst({
      where: { providerReference: reference },
      include: { order: true },
    })) ||
    (await prisma.payment.findFirst({
      where: { providerRequestId: reference },
      include: { order: true },
    }));
  if (!payment) return 0;
  if (payment.status === "PAID") {
    if (payment.order.odooSyncStatus !== "SYNCED" || !payment.order.odooInvoiceId) {
      try {
        const hadInvoice = Boolean(payment.order.odooInvoiceId);
        const result = await finalizeOdooOrderAfterPayment(payment.orderId);
        if (result.invoiceId && !hadInvoice) {
          await sendPaymentConfirmedEmails(payment.orderId);
        }
      } catch {
        // Payment already succeeded; Odoo fatura sync can be retried on the next callback.
      }
    }
    return 1;
  }

  const statusRaw = String(options?.status ?? "").trim().toLowerCase();
  if (statusRaw) {
    const ok = ["paid", "success", "ok", "paga", "pago", "confirmed", "completa", "complete"].includes(
      statusRaw
    );
    if (!ok) {
      throw new Error("invalid_payment_status");
    }
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
    const result = await finalizeOdooOrderAfterPayment(payment.orderId);
    if (!result.stockRefreshed) {
      await decrementLocalStockForPaidOrder(payment.orderId);
    }
  } catch {
    try {
      await decrementLocalStockForPaidOrder(payment.orderId);
    } catch {
      // Payment is already marked paid; stock can be reconciled from Odoo later.
    }
  }

  try {
    await sendPaymentConfirmedEmails(payment.orderId);
  } catch {
    // Never roll back payment because of email failures.
  }

  try {
    await sendPaymentConfirmedSms(payment.orderId);
  } catch {
    // Never roll back payment because of SMS failures.
  }

  return 1;
}
