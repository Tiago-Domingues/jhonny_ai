export type CouponUsageRow = {
  code: string;
  discountCents: number;
  createdAt: Date;
  label?: string | null;
  percentOff?: number | null;
};

export function aggregateCouponUsages(usages: CouponUsageRow[]) {
  const byCode = new Map<
    string,
    { code: string; label: string; percentOff: number; count: number; discountCents: number; lastUsed: Date }
  >();
  for (const usage of usages) {
    const current = byCode.get(usage.code) || {
      code: usage.code,
      label: usage.label || usage.code,
      percentOff: usage.percentOff || 0,
      count: 0,
      discountCents: 0,
      lastUsed: usage.createdAt,
    };
    current.count += 1;
    current.discountCents += usage.discountCents;
    if (usage.createdAt > current.lastUsed) current.lastUsed = usage.createdAt;
    byCode.set(usage.code, current);
  }
  return [...byCode.values()].sort((left, right) => right.count - left.count);
}
