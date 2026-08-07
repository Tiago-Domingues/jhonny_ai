/** Shared shipping rules for checkout UI + server. Keep in sync with launch policy (€100 free). */

export const FREE_SHIPPING_THRESHOLD_CENTS = 10_000; // €100
export const STANDARD_SHIPPING_CENTS = 690; // €6.90

export type FulfillmentMethod = "PICKUP_IN_STORE" | "SHIP_TO_ADDRESS";

export function computeShippingCents(options: {
  fulfillmentMethod: FulfillmentMethod;
  /** Subtotal after discounts, used for free-shipping threshold. */
  amountForShippingCents: number;
}): number {
  if (options.fulfillmentMethod === "PICKUP_IN_STORE") return 0;
  if (options.amountForShippingCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return STANDARD_SHIPPING_CENTS;
}

export function freeShippingThresholdEuros(): number {
  return FREE_SHIPPING_THRESHOLD_CENTS / 100;
}
