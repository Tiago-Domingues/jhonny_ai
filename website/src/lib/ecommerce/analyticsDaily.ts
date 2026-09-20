export const ANALYTICS_CHART_START = "2026-07-01";
export const LISBON_TZ = "Europe/Lisbon";

export type DailyMetrics = {
  key: string;
  views: number;
  newClients: number;
  salesCount: number;
  salesCents: number;
};

export type ChartBucket = "day" | "week" | "month" | "90d";

function parseDay(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day, utc: Date.UTC(year, month - 1, day) };
}

function formatDay(utcMs: number) {
  const date = new Date(utcMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLisbonDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LISBON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Coerce Prisma/pg Date objects, ISO timestamps, or YYYY-MM-DD into a Lisbon day key. */
export function normalizeDayKey(value: unknown): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return todayLisbonDateKey(value);
  }
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return todayLisbonDateKey(parsed);
  const prefix = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return prefix?.[1] ?? null;
}

function emptyDay(key: string): DailyMetrics {
  return { key, views: 0, newClients: 0, salesCount: 0, salesCents: 0 };
}

function bumpDay(
  map: Map<string, DailyMetrics>,
  value: unknown,
  field: "views" | "newClients" | "salesCount" | "salesCents",
  amount: number
) {
  const key = normalizeDayKey(value);
  if (!key || !amount) return;
  const current = map.get(key) || emptyDay(key);
  current[field] += amount;
  map.set(key, current);
}

/**
 * Bucket pageviews, signups, and paid orders onto Lisbon calendar days.
 * Using createdAt in JS avoids Prisma/pg turning SQL `to_char` days into Date
 * objects whose keys then miss `fillDailyRange("YYYY-MM-DD")`.
 */
export function accumulateDailyMetrics(input: {
  views?: Array<{ createdAt: Date | string }>;
  users?: Array<{ createdAt: Date | string }>;
  sales?: Array<{ at: Date | string; totalCents?: number | null }>;
  startKey?: string;
  endKey?: string;
}): DailyMetrics[] {
  const map = new Map<string, DailyMetrics>();
  for (const row of input.views || []) bumpDay(map, row.createdAt, "views", 1);
  for (const row of input.users || []) bumpDay(map, row.createdAt, "newClients", 1);
  for (const row of input.sales || []) {
    bumpDay(map, row.at, "salesCount", 1);
    bumpDay(map, row.at, "salesCents", Number(row.totalCents) || 0);
  }
  return fillDailyRange(
    input.startKey || ANALYTICS_CHART_START,
    input.endKey || todayLisbonDateKey(),
    [...map.values()]
  );
}

export function addDaysToKey(key: string, days: number) {
  return formatDay(parseDay(key).utc + days * 86_400_000);
}

export function fillDailyRange(startKey: string, endKey: string, rows: DailyMetrics[]): DailyMetrics[] {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const start = parseDay(startKey).utc;
  const end = parseDay(endKey).utc;
  const filled: DailyMetrics[] = [];
  for (let cursor = start; cursor <= end; cursor += 86_400_000) {
    const key = formatDay(cursor);
    filled.push(
      byKey.get(key) || { key, views: 0, newClients: 0, salesCount: 0, salesCents: 0 }
    );
  }
  return filled;
}

export function padFutureDays(rows: DailyMetrics[], extraDays = 14, todayKey = todayLisbonDateKey()) {
  if (!rows.length || extraDays <= 0) return rows;
  const lastKey = rows[rows.length - 1].key;
  const endKey = addDaysToKey(todayKey, extraDays);
  if (parseDay(endKey).utc <= parseDay(lastKey).utc) return rows;
  return fillDailyRange(rows[0].key, endKey, rows);
}

function hasActivity(row: DailyMetrics) {
  return row.views > 0 || row.newClients > 0 || row.salesCount > 0 || row.salesCents > 0;
}

/** Last day on or before today that has views, clients, or sales. */
export function lastActiveIndex(rows: DailyMetrics[], todayKey = todayLisbonDateKey()) {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (row.key > todayKey) continue;
    if (hasActivity(row)) return index;
  }
  const todayIndex = rows.findIndex((row) => row.key === todayKey);
  return todayIndex >= 0 ? todayIndex : Math.max(0, rows.length - 1);
}

/** True when older history exists but several of the most recent days have no pageviews. */
export function hasRecentPageviewGap(rows: DailyMetrics[], todayKey = todayLisbonDateKey(), lookback = 7) {
  const past = rows.filter((row) => row.key <= todayKey);
  if (past.length < lookback) return false;
  const recent = past.slice(-lookback);
  const emptyViews = recent.filter((row) => row.views === 0).length;
  const olderHasViews = past.slice(0, -lookback).some((row) => row.views > 0);
  return olderHasViews && emptyViews >= 4;
}

function mondayOf(key: string) {
  const { utc } = parseDay(key);
  const weekday = new Date(utc).getUTCDay();
  const shift = weekday === 0 ? -6 : 1 - weekday;
  return formatDay(utc + shift * 86_400_000);
}

function daysSinceStart(key: string, startKey = ANALYTICS_CHART_START) {
  return Math.floor((parseDay(key).utc - parseDay(startKey).utc) / 86_400_000);
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function bucketDailyMetrics(rows: DailyMetrics[], bucket: ChartBucket): DailyMetrics[] {
  if (bucket === "day") return rows;

  const groups = new Map<string, DailyMetrics[]>();
  for (const row of rows) {
    let key = row.key;
    if (bucket === "week") key = mondayOf(row.key);
    else if (bucket === "month") key = row.key.slice(0, 7);
    else key = String(Math.floor(daysSinceStart(row.key) / 90));
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  }

  return [...groups.entries()].map(([key, list]) => ({
    key,
    views: mean(list.map((row) => row.views)),
    newClients: mean(list.map((row) => row.newClients)),
    salesCount: list.reduce((sum, row) => sum + row.salesCount, 0),
    salesCents: mean(list.map((row) => row.salesCents)),
  }));
}

export function periodLabel(row: DailyMetrics, bucket: ChartBucket) {
  if (bucket === "day") return row.key;
  if (bucket === "week") return `Week of ${row.key}`;
  if (bucket === "month") return row.key;
  const index = Number(row.key);
  if (!Number.isFinite(index)) return row.key;
  const startUtc = parseDay(ANALYTICS_CHART_START).utc + index * 90 * 86_400_000;
  const endUtc = startUtc + 89 * 86_400_000;
  return `${formatDay(startUtc)} – ${formatDay(endUtc)}`;
}
