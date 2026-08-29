import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { getActiveCart, summarizeCart } from "@/lib/ecommerce/cart";
import { checkoutSchema } from "@/lib/ecommerce/schemas";
import { createPaymentForOrder } from "@/lib/ecommerce/payments";
import { sendOrderEmails } from "@/lib/ecommerce/email";
import { validateCoupon } from "@/lib/ecommerce/coupons";
import { shippingQuoteFor } from "@/lib/ecommerce/shipping";
import { normalizeNif } from "@/lib/ecommerce/nif";

type CheckoutIdentity = {
  userId?: string;
  guestToken?: string;
};

function nextOrderNumber() {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(2, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JSS-${stamp}-${suffix}`;
}

export async function createCheckout(
  identity: CheckoutIdentity,
  input: unknown,
  options?: { requestOrigin?: string }
) {
  const data = checkoutSchema.parse(input);
  const cart = await getActiveCart(identity);
  const summary = summarizeCart(cart);
  if (!cart || summary.items.length === 0) {
    throw new Error("Cart is empty.");
  }
  for (const item of cart.items) {
    if (!item.product.availableForSale || item.product.stockQuantity <= 0) {
      throw new Error("OUT_OF_STOCK");
    }
    if (item.quantity > item.product.stockQuantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }
  }

  const coupon = await validateCoupon(data.couponCode, summary.subtotalCents, {
    userId: identity.userId,
    email: data.email,
  });
  const discountCents = coupon?.discountCents || 0;
  const amountForShippingCents = Math.max(0, summary.subtotalCents - discountCents);
  const shippingQuote = shippingQuoteFor({
    fulfillmentMethod: data.fulfillmentMethod,
    amountAfterDiscountCents: amountForShippingCents,
    destinationCountry: data.country,
    items: cart.items.map((item) => ({
      quantity: item.quantity,
      weightKg: item.product.weightKg,
      lengthCm: item.product.lengthCm,
      widthCm: item.product.widthCm,
      heightCm: item.product.heightCm,
      category: item.product.category,
      name: item.product.name,
    })),
  });
  const shippingCents = shippingQuote.shippingCents;
  const totalCents = Math.max(0, summary.subtotalCents + shippingCents - discountCents);
  const customerVat = normalizeNif(data.nif) || null;
  if (identity.userId && customerVat) {
    await prisma.customerProfile.updateMany({
      where: { userId: identity.userId },
      data: { nif: customerVat },
    });
  }
  const guestCheckoutId = identity.userId
    ? null
    : (
        await prisma.guestCheckout.create({
          data: {
            email: data.email,
            phoneCountryCode: data.phoneCountryCode,
            phone: data.phone,
            fullName: data.fullName,
            addressLine1: data.addressLine1 || null,
            addressLine2: data.addressLine2 || null,
            postalCode: data.postalCode || null,
            city: data.city || null,
            country: data.country,
            billingSameAsShipping: data.billingSameAsShipping,
            billingAddressJson: data.billingSameAsShipping
              ? undefined
              : {
                  addressLine1: data.billingAddressLine1,
                  addressLine2: data.billingAddressLine2,
                  postalCode: data.billingPostalCode,
                  city: data.billingCity,
                  country: data.billingCountry,
                },
            nif: customerVat,
            marketingOptIn: data.marketingOptIn,
          },
        })
      ).id;

  const order = await prisma.order.create({
    data: {
      orderNumber: nextOrderNumber(),
      userId: identity.userId,
      guestCheckoutId,
      cartId: cart.id,
      customerEmail: data.email,
      customerPhoneCountryCode: data.phoneCountryCode,
      customerPhone: data.phone,
      customerName: data.fullName,
      customerVat,
      fulfillmentMethod: data.fulfillmentMethod,
      shippingAddressJson:
        data.fulfillmentMethod === "SHIP_TO_ADDRESS"
          ? {
              addressLine1: data.addressLine1,
              addressLine2: data.addressLine2,
              postalCode: data.postalCode,
              city: data.city,
              country: data.country,
            }
          : undefined,
      billingAddressJson: data.billingSameAsShipping
        ? undefined
        : {
            addressLine1: data.billingAddressLine1,
            addressLine2: data.billingAddressLine2,
            postalCode: data.billingPostalCode,
            city: data.billingCity,
            country: data.billingCountry,
          },
      subtotalCents: summary.subtotalCents,
      shippingCents,
      discountCents,
      couponCode: coupon?.code || null,
      totalCents,
      taxCents: 0,
      currency: summary.currency,
      notes: data.notes || null,
      odooSyncStatus: "PENDING_SYNC",
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          sku: item.product.sku || item.product.refId || item.product.slug,
          name: item.product.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalCents: item.unitPriceCents * item.quantity,
          currency: item.currency,
          odooProductId: item.product.odooProductId,
          odooProductTemplateId: item.product.odooProductTemplateId,
        })),
      },
    },
    include: { items: true },
  });

  await prisma.cart.update({ where: { id: cart.id }, data: { status: "ORDERED" } });

  const payment = await createPaymentForOrder(order.id, {
    method: data.paymentMethod,
    amountCents: order.totalCents,
    currency: order.currency,
    email: order.customerEmail,
    phone: order.customerPhone ? `${order.customerPhoneCountryCode}${order.customerPhone}` : undefined,
    mbwayPhone: data.mbwayPhone || `${data.phoneCountryCode}${data.phone}`,
    description: `Jhonny Surf Store ${order.orderNumber}`,
    customerName: order.customerName,
    fulfillmentMethod: data.fulfillmentMethod,
    shippingCountry: data.country,
    returnOrigin: data.returnOrigin,
    requestOrigin: options?.requestOrigin,
  });

  try {
    await sendOrderEmails(order.id);
  } catch {
    // Order + payment already exist; email failures must not fail checkout.
  }
  return { order, payment };
}
