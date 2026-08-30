import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieHeader(setCookie: string | null) {
  return (setCookie || "").split(";")[0];
}

async function registerAndVerify(
  base: string,
  prisma: PrismaClient,
  email: string,
  username: string,
  password: string
) {
  const register = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ email, username, password }),
  });
  assert(register.ok, `register failed ${register.status} ${await register.text()}`);
  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
  assert(pending, "pending row");
  const token = randomBytes(32).toString("base64url");
  await prisma.pendingRegistration.update({
    where: { id: pending.id },
    data: { tokenHash: hashToken(token) },
  });
  const verify = await fetch(`${base}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  assert(verify.ok, `verify failed ${verify.status} ${await verify.text()}`);
  const user = await prisma.user.findUnique({ where: { email } });
  assert(user, "user exists");
  return { user, cookie: cookieHeader(verify.headers.get("set-cookie")) };
}

async function main() {
  const base = (process.env.LAUNCH_TEST_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const stamp = Date.now().toString(36);

  try {
    const redirect = await fetch(`${base}/admin/clientes`, { redirect: "manual" });
    assert(redirect.status === 307, `clientes redirect ${redirect.status}`);
    assert((redirect.headers.get("location") || "").includes("/admin?tab=clientes"), "redirects to tab");

    const customer = await registerAndVerify(
      base,
      prisma,
      `acct-${stamp}@example.com`,
      `acct${stamp}`.slice(0, 32),
      "surflegend1"
    );
    const noPhone = await fetch(`${base}/api/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: customer.cookie },
      body: JSON.stringify({ fullName: "Ana Test", customerType: "SURFER" }),
    });
    assert(noPhone.status === 400, `save without phone should 400, got ${noPhone.status}`);

    const withPhone = await fetch(`${base}/api/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: customer.cookie },
      body: JSON.stringify({
        fullName: "Ana Test",
        customerType: "SURFER",
        phoneCountryCode: "+351",
        phone: "912345678",
        addressLine1: "Rua 1",
        city: "Carcavelos",
        postalCode: "2775-236",
        country: "PT",
        billingSameAsShipping: true,
      }),
    });
    assert(withPhone.ok, `save with phone failed ${withPhone.status} ${await withPhone.text()}`);

    await prisma.user.update({
      where: { id: customer.user.id },
      data: { googleSub: `google-${stamp}` },
    });
    await prisma.customerProfile.update({
      where: { userId: customer.user.id },
      data: { phone: null },
    });
    const blocked = await fetch(`${base}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: customer.cookie },
      body: JSON.stringify({ productId: "missing", quantity: 1 }),
    });
    const blockedBody = await blocked.json().catch(() => ({}));
    assert(!blocked.ok, "google without phone cannot add to cart");
    assert(
      String(blockedBody.message || "").toLowerCase().includes("phone"),
      `google block mentions phone: ${JSON.stringify(blockedBody)}`
    );

    await prisma.customerProfile.update({
      where: { userId: customer.user.id },
      data: { phone: "912345678" },
    });
    await prisma.user.update({
      where: { id: customer.user.id },
      data: { googleSub: null },
    });

    const admin = await registerAndVerify(
      base,
      prisma,
      `admin-${stamp}@example.com`,
      `admin${stamp}`.slice(0, 32),
      "surflegend1"
    );
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: "ADMIN" } });
    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername: admin.user.email, password: "surflegend1" }),
    });
    assert(login.ok, `admin login failed ${login.status}`);
    const adminCookie = cookieHeader(login.headers.get("set-cookie"));

    const analytics = await fetch(`${base}/api/admin/analytics?days=90`, {
      headers: { Cookie: adminCookie },
    });
    const analyticsBody = await analytics.json();
    assert(analytics.ok, `analytics failed ${analytics.status} ${JSON.stringify(analyticsBody)}`);
    assert(analyticsBody.days === 90, "analytics default window 90");
    assert(Array.isArray(analyticsBody.byDay), "byDay array");
    assert(analyticsBody.byDay[0]?.key === "2026-07-01", "chart starts 2026-07-01");
    assert(typeof analyticsBody.allTimeSalesCents === "number", "all-time sales KPI");
    assert(typeof analyticsBody.allTimeOrderCount === "number", "all-time encomendas KPI");

    const analyticsCsv = await fetch(`${base}/api/admin/analytics/export.csv?days=90`, {
      headers: { Cookie: adminCookie },
    });
    assert(analyticsCsv.ok, `analytics csv failed ${analyticsCsv.status}`);
    const analyticsCsvText = await analyticsCsv.text();
    assert(analyticsCsvText.includes("kind,date,views"), "analytics csv header");
    assert(analyticsCsvText.includes("2026-07-01"), "analytics csv includes day 0");

    const paid = await prisma.order.create({
      data: {
        orderNumber: `JSS-TEST-${stamp}`,
        status: "PAID",
        fulfillmentMethod: "SHIP_TO_ADDRESS",
        userId: customer.user.id,
        customerEmail: customer.user.email,
        customerName: "Ana Test",
        customerPhone: "912345678",
        customerPhoneCountryCode: "+351",
        subtotalCents: 5000,
        shippingCents: 0,
        discountCents: 0,
        totalCents: 5000,
        currency: "EUR",
        paidAt: new Date(),
        items: { create: [{ name: "Test board", quantity: 1, unitPriceCents: 5000, totalCents: 5000 }] },
      },
    });

    const orders = await fetch(`${base}/api/account/orders`, { headers: { Cookie: customer.cookie } });
    const orderList = await orders.json();
    const listed = (orderList.orders || []).find((row: { id: string }) => row.id === paid.id);
    assert(listed, "customer sees the paid order");
    assert(listed.hasFaturaRecibo === false, "no fatura until odoo id");

    const fatura = await fetch(`${base}/api/account/orders/${paid.id}/fatura-recibo`, {
      headers: { Cookie: customer.cookie },
    });
    assert(fatura.status === 404, `missing fatura is 404 not ${fatura.status}`);
    const faturaBody = await fatura.json();
    assert(String(faturaBody.message || "").includes("ainda não disponível"), "unavailable message");

    const otherFatura = await fetch(`${base}/api/account/orders/${paid.id}/fatura-recibo`, {
      headers: { Cookie: adminCookie },
    });
    assert(otherFatura.status === 404 || otherFatura.status === 401, "other account cannot download as customer");

    const adminFatura = await fetch(`${base}/api/admin/orders/${paid.id}/fatura-recibo`, {
      headers: { Cookie: adminCookie },
    });
    assert(adminFatura.status === 404, "admin missing fatura is 404");

    const adminOrders = await fetch(`${base}/api/admin/orders`, { headers: { Cookie: adminCookie } });
    const adminOrderBody = await adminOrders.json();
    assert(adminOrders.ok, "admin orders load");
    assert(typeof adminOrderBody.stats.revenueCents === "number", "revenue KPI");
    assert(typeof adminOrderBody.stats.averagePurchaseCents === "number", "AOV KPI");
    assert(typeof adminOrderBody.stats.addressCount === "number", "address KPI");
    assert(typeof adminOrderBody.stats.pickupCount === "number", "pickup KPI");
    assert(adminOrderBody.stats.revenueCents >= 5000, "revenue includes the paid test order");
    assert(adminOrderBody.stats.addressCount >= 1, "address count includes ship-to-address");

    const customers = await fetch(`${base}/api/admin/customers`, { headers: { Cookie: adminCookie } });
    const customerBody = await customers.json();
    assert(customers.ok, "admin customers load");
    assert(customerBody.stats.topSpender?.spentCents >= 5000, "top spender includes the test buyer");

    const history = await fetch(`${base}/api/admin/customers/${customer.user.id}/orders`, {
      headers: { Cookie: adminCookie },
    });
    const historyBody = await history.json();
    assert((historyBody.orders || []).some((row: { id: string }) => row.id === paid.id), "client history lists the order");

    const patch = await fetch(`${base}/api/admin/customers/${customer.user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        fullName: "Ana Admin Edit",
        phoneCountryCode: "+351",
        phone: "919999999",
        customerType: "LOCAL_CUSTOMER",
        preferredLanguage: "pt",
        marketingOptIn: true,
      }),
    });
    assert(patch.ok, `admin edit failed ${patch.status} ${await patch.text()}`);
    const patched = await prisma.customerProfile.findUnique({ where: { userId: customer.user.id } });
    assert(patched?.fullName === "Ana Admin Edit", "admin can edit client name");
    assert(patched?.phone === "919999999", "admin can edit client phone");

    const doomed = await registerAndVerify(
      base,
      prisma,
      `bin-${stamp}@example.com`,
      `bin${stamp}`.slice(0, 32),
      "surflegend1"
    );
    const doomedOrder = await prisma.order.create({
      data: {
        orderNumber: `JSS-BIN-${stamp}`,
        status: "PAID",
        fulfillmentMethod: "PICKUP_IN_STORE",
        userId: doomed.user.id,
        customerEmail: doomed.user.email,
        customerName: "Bin Test",
        customerPhone: "910000000",
        customerPhoneCountryCode: "+351",
        subtotalCents: 1000,
        shippingCents: 0,
        discountCents: 0,
        totalCents: 1000,
        currency: "EUR",
        paidAt: new Date(),
        items: { create: [{ name: "Wax", quantity: 1, unitPriceCents: 1000, totalCents: 1000 }] },
      },
    });
    const customerCannotDelete = await fetch(`${base}/api/admin/customers/${doomed.user.id}`, {
      method: "DELETE",
      headers: { Cookie: customer.cookie },
    });
    assert(customerCannotDelete.status === 401, "only admins can delete clients");

    const selfDelete = await fetch(`${base}/api/admin/customers/${admin.user.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(!selfDelete.ok, "admin cannot delete their own account");

    const adminDelete = await fetch(`${base}/api/admin/customers/${doomed.user.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    assert(adminDelete.ok, `admin delete failed ${adminDelete.status} ${await adminDelete.text()}`);
    const gone = await prisma.user.findUnique({ where: { id: doomed.user.id } });
    assert(!gone, "removed client is gone from the registry");
    const keptOrder = await prisma.order.findUnique({ where: { id: doomedOrder.id } });
    assert(keptOrder, "orders stay after client removal");
    assert(keptOrder.userId === null, "removed client is detached from leftover orders");
    await prisma.order.delete({ where: { id: doomedOrder.id } });

    const csv = await fetch(`${base}/api/admin/orders/export.csv`, { headers: { Cookie: adminCookie } });
    assert(csv.ok, `csv failed ${csv.status}`);
    const csvText = await csv.text();
    assert(csvText.includes("orderNumber"), "csv header");
    assert(csvText.includes(paid.orderNumber), "csv includes the test order");

    await prisma.order.delete({ where: { id: paid.id } });
    console.log("account admin HTTP checks ok");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
