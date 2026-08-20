import "server-only";

import Stripe from "stripe";
import { hasStripeSecret } from "@/lib/ecommerce/stripeCheckout";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function stripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
}

export function stripePaymentMethodConfiguration() {
  return process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION?.trim() || "";
}

export function assertStripeConfigured() {
  if (!hasStripeSecret()) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
}
