/**
 * GUI smoke for the members-only monthly prize wheel.
 *
 * Covers the three states that matter: a guest cannot reach it, a member's
 * first spin of the month awards a unique coupon, and every later spin that
 * month turns for show without minting anything.
 *
 * Requires playwright on the machine (not a repo dependency, same as
 * smoke-firewire-header.mjs) plus the local test accounts:
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/seed-test-users.mjs
 *
 * Run: cd website && node scripts/smoke-monthly-wheel.mjs
 */
import "dotenv/config";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "/tmp/wheel-smoke";
fs.mkdirSync(OUT, { recursive: true });

const PASSWORD = "TestPass123!";
const CODE_PATTERN = /^RODA(5|10|20)-[A-Z0-9]{6}$/;

const consentValue = encodeURIComponent(
  JSON.stringify({
    decisions: { required: true, analytics: false, personalization: false, marketing: false },
    policyVersion: "2026-07-ecommerce-foundation",
  })
);

let checks = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks += 1;
}

function step(message) {
  console.log(`· ${message}`);
}

async function hideDevOverlays(page) {
  await page.addStyleTag({
    content:
      "nextjs-portal, [data-next-badge-root], [data-nextjs-dev-indicator] { display: none !important; }",
  });
}

async function newSession(browser, { viewport = { width: 1440, height: 900 }, locale } = {}) {
  const context = await browser.newContext({ viewport });
  context.setDefaultTimeout(20000);
  await context.addCookies([
    { name: "jss_consent", value: consentValue, domain: "localhost", path: "/" },
  ]);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate((chosen) => {
    sessionStorage.clear();
    // Guests only get the ribbon once the welcome modal has been dismissed, so
    // pre-set that flag to reach the ribbon without waiting out the 7s timer.
    sessionStorage.setItem("jss_welcome_offer_dismissed_v1", "1");
    localStorage.setItem("jss_jhonny_assistant_seen_v1", "1");
    if (chosen) localStorage.setItem("jss-locale-v2", chosen);
  }, locale);
  return { context, page };
}

/** Log in through the real API so the session cookie is genuine. */
async function login(page, email) {
  const status = await page.evaluate(
    async ({ email, password }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername: email, password }),
      });
      return response.status;
    },
    { email, password: PASSWORD }
  );
  assert(status === 200, `login for ${email} returned ${status}`);
}

/** Wipe this month's spin so the run is repeatable. */
async function resetSpins() {
  const { createScriptPrismaClient } = await import("./prisma-client.mjs");
  const prisma = createScriptPrismaClient();
  try {
    const spins = await prisma.wheelSpin.findMany({ select: { couponId: true } });
    await prisma.wheelSpin.deleteMany({});
    const couponIds = spins.map((spin) => spin.couponId).filter(Boolean);
    if (couponIds.length) {
      await prisma.coupon.deleteMany({ where: { id: { in: couponIds } } });
    }
    return spins.length;
  } finally {
    await prisma.$disconnect();
  }
}

async function openWheelFromRibbon(page) {
  await page.locator('[data-testid="free-shipping-widget"]').waitFor({ timeout: 15000 });
  await page.locator(".jss-free-shipping-ribbon").click();
  await page.locator('[data-testid="prize-wheel"]').waitFor({ timeout: 8000 });
  // The card renders a loading phase until /api/wheel/status resolves.
  await page.waitForFunction(
    () => document.querySelector("[data-testid='prize-wheel']")?.dataset.phase !== "loading",
    undefined,
    { timeout: 8000 }
  );
}

async function main() {
  const removed = await resetSpins();
  step(`reset ${removed} existing spin(s) so the run is repeatable`);

  const browser = await chromium.launch({ headless: true });

  // ── Guest: the wheel must be unreachable ─────────────────────────────
  step("guest: wheel is members-only");
  {
    const { context, page } = await newSession(browser);
    await page.reload({ waitUntil: "domcontentloaded" });
    await hideDevOverlays(page);
    await page.locator('[data-testid="free-shipping-widget"]').waitFor({ timeout: 15000 });
    await page.locator(".jss-free-shipping-ribbon").click();
    await page.locator('[aria-labelledby="welcome-offer-title"]').waitFor({ timeout: 6000 });
    assert(
      (await page.locator('[data-testid="prize-wheel"]').count()) === 0,
      "guest: the ribbon must not open the members-only wheel"
    );

    const spinStatus = await page.evaluate(async () => {
      const response = await fetch("/api/wheel/spin", { method: "POST" });
      return response.status;
    });
    assert(spinStatus === 401, `guest: the spin API should refuse with 401, got ${spinStatus}`);
    await context.close();
  }

  // ── Member: first spin of the month awards a unique coupon ───────────
  step("member: first spin awards");
  const { context: memberCtx, page: member } = await newSession(browser);
  await login(member, "wheel1@example.com");
  await member.reload({ waitUntil: "networkidle" });
  await hideDevOverlays(member);

  await openWheelFromRibbon(member);
  assert(
    (await member.locator('[data-testid="prize-wheel-spin"]').getAttribute("data-awards")) ===
      "true",
    "member: an unused month should offer a real spin"
  );

  // allInnerTexts() reads innerText, which SVG elements do not implement.
  const wedgeLabels = await member
    .locator('[data-testid="prize-wheel"] svg text')
    .allTextContents();
  assert(wedgeLabels.length === 10, `member: expected 10 wedges, found ${wedgeLabels.length}`);
  const wedgeCounts = wedgeLabels.reduce((acc, label) => {
    const percent = label.match(/(\d+)\s*%/)?.[1];
    if (percent) acc[percent] = (acc[percent] || 0) + 1;
    return acc;
  }, {});
  assert(
    wedgeCounts["5"] === 4 && wedgeCounts["10"] === 5 && wedgeCounts["20"] === 1,
    `member: wedge counts must match the odds, got ${JSON.stringify(wedgeCounts)}`
  );

  await member.locator('[data-testid="prize-wheel-card"]').screenshot({
    path: path.join(OUT, "wheel_before_spin.png"),
  });

  await member.locator('[data-testid="prize-wheel-spin"]').click();
  await member.locator('[data-testid="prize-wheel-code"]').waitFor({ timeout: 15000 });
  await member.waitForTimeout(1200);

  const wonCode = (await member.locator('[data-testid="prize-wheel-code"]').innerText()).trim();
  assert(CODE_PATTERN.test(wonCode), `member: unexpected coupon shape "${wonCode}"`);
  const heading = await member.locator("#prize-wheel-title").innerText();
  const wonPercent = heading.match(/(\d+)%/)?.[1];
  assert(
    wonCode.startsWith(`RODA${wonPercent}-`),
    `member: headline says ${wonPercent}% but the code is ${wonCode}`
  );
  step(`  won ${wonPercent}% as ${wonCode}`);
  await member.locator('[data-testid="prize-wheel-card"]').screenshot({
    path: path.join(OUT, "wheel_prize.png"),
  });

  // ── Member: the rest of the month spins for show only ────────────────
  step("member: replay does not award");
  await member.locator('[data-testid="prize-wheel-close"]').click();
  await member.locator('[data-testid="prize-wheel"]').waitFor({ state: "detached" });
  await openWheelFromRibbon(member);

  assert(
    (await member.locator('[data-testid="prize-wheel-spin"]').getAttribute("data-awards")) ===
      "false",
    "member: a used month must not offer another awarding spin"
  );
  assert(
    (await member.locator('[data-testid="prize-wheel-code"]').innerText()).trim() === wonCode,
    "member: reopening should repeat the coupon already won"
  );
  const usedHeading = await member.locator("#prize-wheel-title").innerText();
  assert(
    /already spun|já giraste|本月已转动过/i.test(usedHeading),
    `member: expected the already-spun headline, got "${usedHeading}"`
  );
  await member.locator('[data-testid="prize-wheel-card"]').screenshot({
    path: path.join(OUT, "wheel_already_spun.png"),
  });

  await member.locator('[data-testid="prize-wheel-spin"]').click();
  await member.locator('[data-testid="prize-wheel-code"]').waitFor({ timeout: 15000 });
  await member.waitForTimeout(1000);
  assert(
    (await member.locator('[data-testid="prize-wheel-code"]').innerText()).trim() === wonCode,
    "member: an illustrative spin must not mint a new coupon"
  );

  const afterReplay = await member.evaluate(async () => {
    const response = await fetch("/api/wheel/status");
    return response.json();
  });
  assert(
    afterReplay.eligible === false && afterReplay.prize.code,
    "member: status should still report the single monthly prize"
  );
  assert(
    afterReplay.prize.code === wonCode,
    `member: the stored prize changed after a replay spin (${afterReplay.prize.code})`
  );

  // ── The coupon must actually work, and only for its winner ───────────
  step("member: coupon redeems for the winner only");
  const redemption = await member.evaluate(async (code) => {
    const list = await (await fetch("/api/products?limit=1")).json();
    const products = list.products || list.items || list;
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: products[0].id, quantity: 1 }),
    });
    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return { status: response.status, body: await response.json() };
  }, wonCode);
  assert(
    redemption.status === 200 && redemption.body.coupon,
    `member: the winner could not redeem their own coupon (${JSON.stringify(redemption.body)})`
  );
  assert(
    redemption.body.coupon.percentOff === Number(wonPercent),
    `member: coupon is ${redemption.body.coupon.percentOff}% but the wheel promised ${wonPercent}%`
  );
  await memberCtx.close();

  // A different account must not be able to spend someone else's prize.
  const { context: otherCtx, page: other } = await newSession(browser);
  await login(other, "wheel2@example.com");
  const stolen = await other.evaluate(async (code) => {
    const list = await (await fetch("/api/products?limit=1")).json();
    const products = list.products || list.items || list;
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: products[0].id, quantity: 1 }),
    });
    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return { status: response.status, body: await response.json() };
  }, wonCode);
  assert(
    stolen.status !== 200,
    "another account must not be able to redeem a prize it did not win"
  );
  assert(
    /another account/i.test(stolen.body.message || ""),
    `unexpected rejection message: ${stolen.body.message}`
  );

  // The second account still has its own untouched monthly spin.
  const otherStatus = await other.evaluate(async () => {
    const response = await fetch("/api/wheel/status");
    return response.json();
  });
  assert(
    otherStatus.eligible === true,
    "a second account should have its own spin available"
  );
  await otherCtx.close();

  // ── The homepage pop-up: members get the wheel, guests the invite ────
  step("homepage pop-up routing");

  // A member with an unused spin gets the wheel on the homepage.
  {
    const { context, page } = await newSession(browser);
    await login(page, "wheel2@example.com");
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await hideDevOverlays(page);
    await page.locator('[data-testid="prize-wheel"]').waitFor({ timeout: 15000 });
    assert(
      (await page.locator('[aria-labelledby="welcome-offer-title"]').count()) === 0,
      "member: the register invite must not appear for someone already registered"
    );
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, "homepage_popup_member.png") });
    await context.close();
  }

  // The same member elsewhere on the site is left alone.
  {
    const { context, page } = await newSession(browser);
    await login(page, "wheel2@example.com");
    await page.goto(`${BASE}/loja`, { waitUntil: "domcontentloaded" });
    await hideDevOverlays(page);
    await page.waitForTimeout(10000);
    assert(
      (await page.locator('[data-testid="prize-wheel"]').count()) === 0,
      "member: the wheel should only pop up on the homepage"
    );
    await context.close();
  }

  // A member who already spent this month is not nagged again.
  {
    const { context, page } = await newSession(browser);
    await login(page, "wheel1@example.com");
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await hideDevOverlays(page);
    await page.waitForTimeout(10000);
    assert(
      (await page.locator('[data-testid="prize-wheel"]').count()) === 0,
      "member: an already-used month must not reopen the wheel automatically"
    );
    await context.close();
  }

  // A guest still gets the register invite, unchanged.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    context.setDefaultTimeout(20000);
    await context.addCookies([
      { name: "jss_consent", value: consentValue, domain: "localhost", path: "/" },
    ]);
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await hideDevOverlays(page);
    await page.locator('[aria-labelledby="welcome-offer-title"]').waitFor({ timeout: 15000 });
    assert(
      (await page.locator('[data-testid="prize-wheel"]').count()) === 0,
      "guest: the homepage pop-up must be the register invite, not the wheel"
    );
    await page.screenshot({ path: path.join(OUT, "homepage_popup_guest.png") });
    await context.close();
  }

  await browser.close();
  console.log(`\nMonthly wheel smoke passed (${checks} assertions).`);
  console.log(`Artifacts in ${OUT}`);
}

main().catch((error) => {
  console.error("\nSMOKE FAILED:", error.message.split("\n").slice(0, 6).join("\n"));
  process.exitCode = 1;
  process.exit(1);
});
