import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  OVERSIZE_SHIPPING_CENTS,
  fallbackWeightKg,
  shippingCentsFor,
  shippingQuoteFor,
  volumetricWeightKg,
} from "../src/lib/ecommerce/shipping";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(volumetricWeightKg(40, 30, 20) === (40 * 30 * 20) / 4000, "volumetric weight uses CTT factor 4000");
assert(fallbackWeightKg("Surfboards", "Hypto") === 4, "boards get a 4kg fallback");
assert(fallbackWeightKg("Wax", "Sex Wax") === 0.3, "wax gets a 0.3kg fallback");

const pickup = shippingQuoteFor({
  fulfillmentMethod: "PICKUP_IN_STORE",
  amountAfterDiscountCents: 2000,
  items: [{ quantity: 1, weightKg: 1, name: "Wax" }],
});
assert(pickup.shippingCents === 0 && pickup.freeReason === "pickup", "pickup is free");

const free = shippingQuoteFor({
  fulfillmentMethod: "SHIP_TO_ADDRESS",
  amountAfterDiscountCents: FREE_SHIPPING_THRESHOLD_CENTS,
  items: [{ quantity: 1, weightKg: 8, name: "Wetsuit" }],
});
assert(free.shippingCents === 0 && free.freeReason === "threshold", "€100 after discount ships free");

const under = shippingQuoteFor({
  fulfillmentMethod: "SHIP_TO_ADDRESS",
  amountAfterDiscountCents: 4000,
  destinationCountry: "PT",
  items: [{ quantity: 1, weightKg: 1.2, name: "Wax" }],
});
assert(under.shippingCents === 490, "0-2kg band is €4.90");

const mid = shippingCentsFor({
  fulfillmentMethod: "SHIP_TO_ADDRESS",
  amountAfterDiscountCents: 5000,
  items: [{ quantity: 1, weightKg: 3, name: "Wetsuit" }],
});
assert(mid === 690, "2-5kg band keeps the previous €6.90 rate");

const couponPullsUnder = shippingQuoteFor({
  fulfillmentMethod: "SHIP_TO_ADDRESS",
  amountAfterDiscountCents: 9000,
  items: [{ quantity: 1, weightKg: 1, name: "Leash" }],
});
assert(couponPullsUnder.shippingCents === 490, "coupon that drops the cart under €100 still charges shipping");

const oversized = shippingQuoteFor({
  fulfillmentMethod: "SHIP_TO_ADDRESS",
  amountAfterDiscountCents: 2000,
  items: [{ quantity: 1, weightKg: 4, lengthCm: 190, widthCm: 50, heightCm: 8, name: "Surfboard" }],
});
assert(oversized.oversized && oversized.shippingCents === OVERSIZE_SHIPPING_CENTS, "oversized boards use the bulky estimate");

const intl = shippingQuoteFor({
  fulfillmentMethod: "SHIP_TO_ADDRESS",
  amountAfterDiscountCents: 2000,
  destinationCountry: "ES",
  items: [{ quantity: 1, weightKg: 1, name: "Wax" }],
});
assert(intl.shippingCents === Math.round(490 * 1.5), "non-PT destinations use the international multiplier");

console.log("shipping quote checks passed");
