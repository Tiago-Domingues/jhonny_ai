export const FREE_SHIPPING_THRESHOLD_EUROS = 100;
export const FREE_SHIPPING_THRESHOLD_CENTS = FREE_SHIPPING_THRESHOLD_EUROS * 100;
export const STANDARD_SHIPPING_CENTS = 690;

export function shippingCentsFor(input: {
  fulfillmentMethod: "PICKUP_IN_STORE" | "SHIP_TO_ADDRESS";
  amountAfterDiscountCents: number;
}) {
  if (input.fulfillmentMethod === "PICKUP_IN_STORE") return 0;
  if (input.amountAfterDiscountCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return STANDARD_SHIPPING_CENTS;
}
