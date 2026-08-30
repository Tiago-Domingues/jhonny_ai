import { profileSchema } from "../src/lib/ecommerce/schemas";
import { bucketDailyMetrics, fillDailyRange, periodLabel } from "../src/lib/ecommerce/analyticsDaily";
import { isPaidPlusStatus } from "../src/lib/ecommerce/orderKpis";
import { readFileSync } from "node:fs";
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

const account = readFileSync(resolve(__dirname, "../src/components/AccountClient.tsx"), "utf8");
assert(account.includes('href="#dados"'), "account nav has My Data");
assert(account.includes('id="dados"'), "My Data section id exists");
assert(account.includes("editData"), "Edit data control exists");

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

console.log("account admin plan checks ok");
