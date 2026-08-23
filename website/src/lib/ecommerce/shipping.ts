export const FREE_SHIPPING_THRESHOLD_EUROS = 100;
export const FREE_SHIPPING_THRESHOLD_CENTS = FREE_SHIPPING_THRESHOLD_EUROS * 100;
/** Mid-band CTT estimate; kept as the previous flat ship-to-home rate. */
export const STANDARD_SHIPPING_CENTS = 690;
export const VOLUMETRIC_FACTOR = 4000;
export const CTT_POSTAL_MAX_KG = 10;
export const CTT_MAX_GIRTH_CM = 300;
export const CTT_MAX_SIDE_CM = 150;
export const OVERSIZE_SHIPPING_CENTS = 2990;
export const INTERNATIONAL_SHIPPING_MULTIPLIER = 1.5;

export const SHIPPING_BANDS: Array<{ maxKg: number; cents: number }> = [
  { maxKg: 2, cents: 490 },
  { maxKg: 5, cents: 690 },
  { maxKg: 10, cents: 990 },
  { maxKg: 20, cents: 1490 },
  { maxKg: 30, cents: 1990 },
];

export type ShippingItem = {
  quantity: number;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  category?: string | null;
  name?: string | null;
};

export type ShippingQuote = {
  shippingCents: number;
  freeReason: "pickup" | "threshold" | null;
  billableKg: number;
  oversized: boolean;
  note: "bulky" | null;
};

export function volumetricWeightKg(
  lengthCm?: number | null,
  widthCm?: number | null,
  heightCm?: number | null
) {
  const length = Number(lengthCm || 0);
  const width = Number(widthCm || 0);
  const height = Number(heightCm || 0);
  if (length <= 0 || width <= 0 || height <= 0) return 0;
  return (length * width * height) / VOLUMETRIC_FACTOR;
}

export function fallbackWeightKg(category = "", name = "") {
  const hay = `${category} ${name}`.toLowerCase();
  if (/prancha|surfboard|board|bodyboard|longboard/.test(hay)) return 4;
  if (/fato|wetsuit|neoprene/.test(hay)) return 2;
  if (/wax|parafina/.test(hay)) return 0.3;
  if (/apparel|roupa|t-shirt|hoodie|calção|calcao|shorts|jacket/.test(hay)) return 0.5;
  return 0.8;
}

export function isOversized(item: {
  weightKg: number;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
}) {
  if (item.weightKg > CTT_POSTAL_MAX_KG) return true;
  const dims = [item.lengthCm, item.widthCm, item.heightCm]
    .map((value) => Number(value || 0))
    .filter((value) => value > 0);
  if (dims.length === 3) {
    const [longest, mid, shortest] = [...dims].sort((left, right) => right - left);
    if (longest > CTT_MAX_SIDE_CM) return true;
    if (longest + 2 * mid + 2 * shortest > CTT_MAX_GIRTH_CM) return true;
  }
  return false;
}

export function shippingQuoteFor(input: {
  fulfillmentMethod: "PICKUP_IN_STORE" | "SHIP_TO_ADDRESS";
  amountAfterDiscountCents: number;
  destinationCountry?: string | null;
  items: ShippingItem[];
}): ShippingQuote {
  if (input.fulfillmentMethod === "PICKUP_IN_STORE") {
    return { shippingCents: 0, freeReason: "pickup", billableKg: 0, oversized: false, note: null };
  }
  if (input.amountAfterDiscountCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return { shippingCents: 0, freeReason: "threshold", billableKg: 0, oversized: false, note: null };
  }

  let billableKg = 0;
  let oversized = false;
  for (const item of input.items) {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const real =
      item.weightKg && item.weightKg > 0
        ? item.weightKg
        : fallbackWeightKg(item.category || "", item.name || "");
    const volumetric = volumetricWeightKg(item.lengthCm, item.widthCm, item.heightCm);
    const unitKg = Math.max(real, volumetric);
    billableKg += unitKg * quantity;
    if (
      isOversized({
        weightKg: unitKg,
        lengthCm: item.lengthCm,
        widthCm: item.widthCm,
        heightCm: item.heightCm,
      })
    ) {
      oversized = true;
    }
  }

  if (oversized) {
    return {
      shippingCents: OVERSIZE_SHIPPING_CENTS,
      freeReason: null,
      billableKg: Number(billableKg.toFixed(3)),
      oversized: true,
      note: "bulky",
    };
  }

  const band = SHIPPING_BANDS.find((entry) => billableKg <= entry.maxKg) || SHIPPING_BANDS[SHIPPING_BANDS.length - 1];
  let shippingCents = band.cents;
  const country = (input.destinationCountry || "PT").trim().toUpperCase();
  if (country && country !== "PT") {
    shippingCents = Math.round(shippingCents * INTERNATIONAL_SHIPPING_MULTIPLIER);
  }

  return {
    shippingCents,
    freeReason: null,
    billableKg: Number(billableKg.toFixed(3)),
    oversized: false,
    note: null,
  };
}

export function shippingCentsFor(input: {
  fulfillmentMethod: "PICKUP_IN_STORE" | "SHIP_TO_ADDRESS";
  amountAfterDiscountCents: number;
  destinationCountry?: string | null;
  items?: ShippingItem[];
}) {
  return shippingQuoteFor({
    ...input,
    items: input.items || [],
  }).shippingCents;
}
