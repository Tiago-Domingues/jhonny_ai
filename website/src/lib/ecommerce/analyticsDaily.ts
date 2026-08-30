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
