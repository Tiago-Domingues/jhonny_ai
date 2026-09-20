import { profileSchema } from "../src/lib/ecommerce/schemas";
import {
  addDaysToKey,
  accumulateDailyMetrics,
  bucketDailyMetrics,
  fillDailyRange,
  hasRecentPageviewGap,
  lastActiveIndex,
  normalizeDayKey,
  padFutureDays,
  periodLabel,
} from "../src/lib/ecommerce/analyticsDaily";
import { isPaidPlusStatus } from "../src/lib/ecommerce/orderKpis";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(!profileSchema.safeParse({ fullName: "Ana", customerType: "SURFER" }).success, "phone required on save");
assert(
  profileSchema.safeParse({
    fullName: "Ana Silva",
    customerType: "SURFER",
    phoneCountryCode: "+351",
    phone: "912345678",
  }).success,
  "valid phone saves"
);

assert(isPaidPlusStatus("PAID") && isPaidPlusStatus("DELIVERED"), "paid+ includes delivered");
assert(!isPaidPlusStatus("PENDING_PAYMENT") && !isPaidPlusStatus("CANCELLED"), "pending/cancelled excluded");

const filled = fillDailyRange("2026-07-01", "2026-07-03", [
  { key: "2026-07-02", views: 10, newClients: 1, salesCount: 1, salesCents: 4000 },
]);
assert(filled.length === 3, "fills every day");
assert(filled[0].views === 0 && filled[1].views === 10, "zero-fills missing days");

const weekly = bucketDailyMetrics(filled, "week");
assert(weekly.length === 1, "july 1-3 2026 is one week");
assert(weekly[0].views === (0 + 10 + 0) / 3, "weekly views are the daily mean");
assert(periodLabel(weekly[0], "week").includes("2026-06-29"), "week label uses monday");

const padded = padFutureDays(filled, 2, "2026-07-03");
assert(padded.length === 5, "pads two future days after today");
assert(padded[3].key === "2026-07-04" && padded[3].views === 0, "future days are zero");
assert(addDaysToKey("2026-07-01", 14) === "2026-07-15", "adds calendar days");

const gapDays = fillDailyRange("2026-09-01", "2026-09-20", [
  { key: "2026-09-10", views: 40, newClients: 1, salesCount: 1, salesCents: 2000 },
]);
assert(lastActiveIndex(gapDays, "2026-09-20") === gapDays.findIndex((row) => row.key === "2026-09-10"), "chart focuses last day with data");
assert(hasRecentPageviewGap(gapDays, "2026-09-20"), "flags a Prisma-style pageview hole");
assert(!hasRecentPageviewGap(filled, "2026-07-03"), "short ranges without a hole stay quiet");

assert(normalizeDayKey("2026-09-18") === "2026-09-18", "plain day keys stay plain");
assert(normalizeDayKey(new Date("2026-09-18T00:00:00.000Z")) === "2026-09-18", "UTC midnight Date stays 18 Sep in Lisbon summer");
assert(normalizeDayKey("2026-09-18T23:30:00.000Z") === "2026-09-19", "late UTC timestamps roll to the next Lisbon day");

const droppedBySqlDateKeys = fillDailyRange("2026-09-18", "2026-09-20", [
  {
    key: new Date("2026-09-19T00:00:00.000Z") as unknown as string,
    views: 8,
    newClients: 1,
    salesCount: 1,
    salesCents: 5000,
  },
]);
assert(
  droppedBySqlDateKeys.every((row) => row.views === 0),
  "Date objects as map keys used to zero-out recent days"
);

const lastDays = accumulateDailyMetrics({
  views: [
    { createdAt: new Date("2026-09-18T22:30:00.000Z") },
    { createdAt: "2026-09-18T23:30:00.000Z" },
    { createdAt: new Date("2026-09-20T10:00:00.000Z") },
  ],
  users: [{ createdAt: new Date("2026-09-20T11:00:00.000Z") }],
  sales: [{ at: new Date("2026-09-19T09:00:00.000Z"), totalCents: 12900 }],
  startKey: "2026-09-18",
  endKey: "2026-09-20",
});
assert(lastDays.length === 3, "last-days window is 18-20 Sep");
assert(lastDays[0].key === "2026-09-18" && lastDays[0].views === 1, "18 Sep evening UTC stays on 18 Sep Lisbon");
assert(lastDays[1].key === "2026-09-19" && lastDays[1].views === 1 && lastDays[1].salesCount === 1, "19 Sep keeps views and sales");
assert(lastDays[1].salesCents === 12900, "19 Sep sales cents survive JS bucketing");
assert(lastDays[2].key === "2026-09-20" && lastDays[2].views === 1 && lastDays[2].newClients === 1, "20 Sep shows restored traffic");
assert(lastActiveIndex(lastDays, "2026-09-20") === 2, "selection lands on the last day that has figures");

const account = readFileSync(resolve(__dirname, "../src/components/AccountClient.tsx"), "utf8");
assert(account.includes('href="#dados"'), "account nav has My Data");
assert(account.includes('id="dados"'), "My Data section id exists");
assert(account.includes("editData"), "Edit data control exists");
assert(account.includes('name="marketingOptIn"'), "account has marketing opt-in");
assert(account.includes("defaultChecked"), "marketing is selected by default on register");

const orders = readFileSync(resolve(__dirname, "../src/components/AccountOrders.tsx"), "utf8");
assert(orders.includes("FaturaAttachment"), "orders show fatura attachment");

const adminPage = readFileSync(resolve(__dirname, "../src/app/admin/page.tsx"), "utf8");
assert(adminPage.includes("AdminShell"), "single admin page exists");
const clientes = readFileSync(resolve(__dirname, "../src/app/admin/clientes/page.tsx"), "utf8");
assert(clientes.includes("/admin?tab=clientes"), "old clientes route redirects");

const header = readFileSync(resolve(__dirname, "../src/components/Header.tsx"), "utf8");
assert(header.includes('href="/admin"'), "profile menu has one Admin link");
assert(!header.includes("Admin · Clientes"), "profile menu does not list Admin · Clientes");
assert(!header.includes("Admin · Encomendas"), "profile menu does not list Admin · Encomendas");
assert(!header.includes("Admin · Analytics"), "profile menu does not list Admin · Analytics");

const chart = readFileSync(resolve(__dirname, "../src/components/AdminDailyChart.tsx"), "utf8");
assert(chart.includes("overflow-x-auto"), "chart scrolls inside its card");
assert(chart.includes("overscroll-x-contain"), "chart scroll does not drag the page");
assert(chart.includes("hoje"), "chart marks today");
assert(chart.includes("lastActiveIndex"), "chart opens on the last day with figures");
assert(chart.includes("FUTURE_DAYS = 0"), "chart does not pad empty future days");
assert(!chart.includes("onMouseEnter"), "hover does not steal the last active day");
assert(chart.includes("último dia com"), "copy says the chart opens on the last day with figures");

const analyticsLib = readFileSync(resolve(__dirname, "../src/lib/ecommerce/analytics.ts"), "utf8");
assert(analyticsLib.includes("accumulateDailyMetrics"), "admin summary buckets Lisbon days in JS");
assert(!analyticsLib.includes("$queryRawUnsafe"), "admin summary no longer groups days in raw SQL");
assert(analyticsLib.includes("hasAnalyticsConsentValue"), "consent helper reads the cookie JSON value");

const beacon = readFileSync(resolve(__dirname, "../src/components/VisitBeacon.tsx"), "utf8");
assert(beacon.includes("skipInitial"), "beacon can skip a document load already recorded on the server");

const layout = readFileSync(resolve(__dirname, "../src/app/layout.tsx"), "utf8");
assert(layout.includes("ServerVisitCollector"), "document loads record visits on the server");

const proxy = readFileSync(resolve(__dirname, "../src/proxy.ts"), "utf8");
assert(proxy.includes("x-jss-pathname"), "proxy forwards the document path for server visit collection");
assert(!existsSync(resolve(__dirname, "../src/middleware.ts")), "no Next 16 middleware file beside proxy.ts");

const analyticsClient = readFileSync(resolve(__dirname, "../src/components/AdminAnalyticsClient.tsx"), "utf8");
assert(analyticsClient.includes("/api/admin/analytics/export.csv"), "analytics has CSV export");
assert(analyticsClient.includes("truncate"), "visit rows truncate long URLs");

const exportRoute = readFileSync(resolve(__dirname, "../src/app/api/admin/analytics/export.csv/route.ts"), "utf8");
assert(exportRoute.includes("jhonny-analytics-"), "CSV filename is dated");

console.log("account admin plan checks ok");
