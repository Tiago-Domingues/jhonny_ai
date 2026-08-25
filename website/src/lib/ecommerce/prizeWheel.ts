/**
 * Prize wheel odds, layout and calendar-month bookkeeping.
 *
 * Shared by the API routes and the wheel component, so it must stay free of
 * server-only imports. The draw itself is only ever invoked on the server —
 * a client-side draw would let anyone award themselves the top prize.
 */

export const STORE_TIME_ZONE = "Europe/Lisbon";

/**
 * Wedge order around the wheel, clockwise from 12 o'clock.
 *
 * The counts deliberately mirror PRIZE_WEIGHTS (four 5s, five 10s, one 20),
 * so a customer who counts the wedges sees the true odds. Displaying a
 * different number of wedges than the weights imply reads as rigged.
 */
export const WHEEL_LAYOUT = [10, 5, 10, 5, 20, 5, 10, 5, 10, 10] as const;

export const WHEEL_SEGMENT_COUNT = WHEEL_LAYOUT.length;

export type PrizePercent = 5 | 10 | 20;

export const PRIZE_WEIGHTS: Record<PrizePercent, number> = {
  5: 0.4,
  10: 0.5,
  20: 0.1,
};

export const PRIZE_PERCENTS = [5, 10, 20] as const;

/** Weighted pick plus a random wedge showing that prize. */
export function drawPrize(random: () => number = Math.random): {
  percent: PrizePercent;
  segmentIndex: number;
} {
  const roll = random();
  let cumulative = 0;
  let percent: PrizePercent = 5;

  for (const candidate of PRIZE_PERCENTS) {
    cumulative += PRIZE_WEIGHTS[candidate];
    if (roll < cumulative) {
      percent = candidate;
      break;
    }
    // Guard against floating-point drift leaving `roll` past the last bucket.
    percent = candidate;
  }

  const matching = WHEEL_LAYOUT.reduce<number[]>((indexes, value, index) => {
    if (value === percent) indexes.push(index);
    return indexes;
  }, []);
  const segmentIndex = matching[Math.floor(random() * matching.length)] ?? matching[0]!;

  return { percent, segmentIndex };
}

/** First wedge showing a given prize — used to park the wheel on a past win. */
export function segmentForPercent(percent: number) {
  const index = WHEEL_LAYOUT.indexOf(percent as PrizePercent);
  return index === -1 ? 0 : index;
}

/**
 * Offset of the store timezone at a given instant, in milliseconds.
 *
 * Lisbon shifts between UTC+0 and UTC+1, so month boundaries cannot be
 * computed in UTC without being up to an hour wrong on the 1st.
 */
function storeOffsetMs(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    // Some ICU builds render midnight as hour 24.
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtc - date.getTime();
}

/** Calendar-month bucket in store time, e.g. "2026-08". */
export function currentPeriodKey(now: Date = new Date()) {
  const offset = storeOffsetMs(now);
  const local = new Date(now.getTime() + offset);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** First instant of a store-time month, as a real (UTC-based) Date. */
function periodStart(year: number, month: number) {
  const guess = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  // The offset at the guessed instant is correct unless the month starts
  // inside a DST transition, which Lisbon's 01:00 changeover never does.
  return new Date(guess - storeOffsetMs(new Date(guess)));
}

/** Last instant of the given period — what a wheel coupon expires at. */
export function periodExpiresAt(periodKey: string) {
  const [year, month] = periodKey.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return new Date(periodStart(nextYear, nextMonth).getTime() - 1);
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Unique per-spin code, e.g. "RODA20-7K3QP1".
 *
 * The alphabet drops 0/O/1/I so codes survive being read aloud or retyped,
 * and its length (32) divides 256, so the byte-to-character mapping is unbiased.
 */
export function generateWheelCode(percent: number, length = 6) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let suffix = "";
  for (const byte of bytes) suffix += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return `RODA${percent}-${suffix}`;
}

/** True for any code minted by the wheel, used to key off wheel-specific rules. */
export function isWheelCode(code: string) {
  return /^RODA(5|10|20)-[A-Z0-9]{4,}$/.test(code.trim().toUpperCase());
}
