import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { getActiveCart, summarizeCart } from "@/lib/ecommerce/cart";
import { checkoutSchema } from "@/lib/ecommerce/schemas";
import { createPaymentForOrder } from "@/lib/ecommerce/payments";
import { sendOrderEmails } from "@/lib/ecommerce/email";
import { validateCoupon } from "@/lib/ecommerce/coupons";

type CheckoutIdentity = {
  userId?: string;
  guestToken?: string;
};

function nextOrderNumber() {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(2, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JSS-${stamp}-${suffix}`;
}

export async function createCheckout(identity: CheckoutIdentity, input: unknown) {
  const data = checkoutSchema.parse(input);
  const cart = await getActiveCart(identity);
  const summary = summarizeCart(cart);
  if (!cart || summary.items.length === 0) {
    throw new Error("Cart is empty.");
  }
  for (const item of cart.items) {
    if (!item.product.availableForSale || item.product.stockQuantity <= 0) {
      throw new Error(`${item.product.name} is currently out of stock.`);
    }
    if (item.quantity > item.product.stockQuantity) {
      throw new Error(`Only ${item.product.stockQuantity} unit(s) of ${item.product.name} are available.`);
    }
  }

  const coupon = await validateCoupon(data.couponCode, summary.subtotalCents, {
    userId: identity.userId,
    email: data.email,
  });
  const discountCents = coupon?.discountCents || 0;
  const shippingCents = data.fulfillmentMethod === "PICKUP_IN_STORE" ? 0 : 690;
  const totalCents = Math.max(0, summary.subtotalCents + shippingCents - discountCents);
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

  if (coupon) {
    await prisma.couponUsage.create({
      data: {
        couponId: coupon.id,
        orderId: order.id,
        userId: identity.userId || null,
        guestEmail: identity.userId ? null : data.email,
        code: coupon.code,
        discountCents,
        subtotalCents: summary.subtotalCents,
      },
    });
  }

  await prisma.cart.update({ where: { id: cart.id }, data: { status: "ORDERED" } });

  const payment = await createPaymentForOrder(order.id, {
    method: data.paymentMethod,
    amountCents: order.totalCents,
    currency: order.currency,
    email: order.customerEmail,
    phone: order.customerPhone ? `${order.customerPhoneCountryCode}${order.customerPhone}` : undefined,
    mbwayPhone: data.mbwayPhone || `${data.phoneCountryCode}${data.phone}`,
    description: `Jhonny Surf Store ${order.orderNumber}`,
  });

  await sendOrderEmails(order.id);
  return { order, payment };
}
