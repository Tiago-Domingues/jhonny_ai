export const PAID_PLUS_STATUSES = [
  "PAID",
  "PREPARING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
] as const;

export type PaidPlusStatus = (typeof PAID_PLUS_STATUSES)[number];

export function isPaidPlusStatus(status: string): status is PaidPlusStatus {
  return (PAID_PLUS_STATUSES as readonly string[]).includes(status);
}
