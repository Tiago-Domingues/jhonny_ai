export type PricedLine = {
  totalCents: number;
};

export type AllocatedLine<T extends PricedLine> = T & {
  discountCents: number;
  netCents: number;
};

/** Split an order-level coupon across product lines; leftover cents go to the last line. */
export function allocateDiscountCents<T extends PricedLine>(
  items: T[],
  discountCents: number
): Array<AllocatedLine<T>> {
  const productTotal = items.reduce((sum, item) => sum + item.totalCents, 0);
  let leftover = Math.max(0, Math.round(discountCents));
  return items.map((item, index) => {
    const isLast = index === items.length - 1;
    const share =
      productTotal <= 0 ? 0 : Math.round((item.totalCents / productTotal) * Math.max(0, discountCents));
    const discount = isLast
      ? leftover
      : Math.min(Math.max(0, share), leftover, Math.max(0, item.totalCents));
    leftover -= discount;
    return {
      ...item,
      discountCents: discount,
      netCents: Math.max(0, item.totalCents - discount),
    };
  });
}

export function lineDiscountPercent(grossCents: number, netCents: number) {
  if (grossCents <= 0) return 0;
  return Number(((1 - netCents / grossCents) * 100).toFixed(2));
}

export function couponFaturaNote(input: {
  couponCode?: string | null;
  couponPercentOff?: number | null;
  couponLabel?: string | null;
}) {
  const code = input.couponCode?.trim();
  if (!code) return "";
  const percent =
    input.couponPercentOff != null && Number.isFinite(input.couponPercentOff)
      ? ` (-${input.couponPercentOff}%)`
      : "";
  const label = input.couponLabel?.trim() ? `: ${input.couponLabel.trim()}` : "";
  return `Cupão ${code}${percent}${label}`;
}

export function checkoutTotalCents(input: {
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
}) {
  return Math.max(0, input.subtotalCents + input.shippingCents - input.discountCents);
}

/** Percent-off coupons must follow the live cart, never a snapshot from when the code was applied. */
export function percentOffDiscountCents(subtotalCents: number, percentOff: number) {
  const subtotal = Math.max(0, Math.round(Number(subtotalCents) || 0));
  const percent = Math.max(0, Number(percentOff) || 0);
  if (subtotal <= 0 || percent <= 0) return 0;
  return Math.min(subtotal, Math.floor((subtotal * percent) / 100));
}
