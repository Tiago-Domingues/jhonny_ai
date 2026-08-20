/**
 * GUI smoke for Firewire-style header + welcome ribbon.
 * Run: cd website && node scripts/smoke-firewire-header.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const consentValue = encodeURIComponent(
  JSON.stringify({
    decisions: { required: true, analytics: true, personalization: true, marketing: true },
    policyVersion: "2026-07-ecommerce-foundation",
  })
);

async function dismissWelcomeIfOpen(page) {
  const dialog = page.getByRole("dialog");
  if (await dialog.count()) {
    const dismiss = page.getByRole("button", { name: /Not now|Agora não|稍后再说/i });
    if (await dismiss.count()) await dismiss.click();
    else await page.getByRole("button", { name: /^Close$/i }).first().click();
    await page.waitForTimeout(300);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  });
  await context.addCookies([
    { name: "jss_consent", value: consentValue, domain: "localhost", path: "/" },
  ]);
  const page = await context.newPage();

  // Mark welcome already dismissed so header interactions aren't blocked.
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    sessionStorage.setItem("jss_welcome_offer_dismissed_v1", "1");
    sessionStorage.setItem("jss_welcome_ribbon_hidden_v1", "1");
  });
  await page.reload({ waitUntil: "networkidle" });
  await dismissWelcomeIfOpen(page);

  await page.getByRole("link", { name: /Try a Board|Experimentar/i }).waitFor({ timeout: 10000 });
  await page.screenshot({ path: path.join(OUT, "header_right_cluster.png"), fullPage: false });

  await page.locator('header button[aria-label*="Search"]').click();
  await page.getByPlaceholder(/Search|Pesquisar|搜索/).fill("air");
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, "header_search_overlay.png") });
  await page.keyboard.press("Escape");

  await page.locator('header button[aria-label="Cart"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "header_cart_drawer.png") });
  await page.keyboard.press("Escape");

  await page.locator('header button[aria-label="Accessibility"]').filter({ visible: true }).first().click();
  await page.getByText(/Larger text|Texto maior|更大字体/i).waitFor();
  await page.locator('aside input[type="checkbox"]').first().check();
  await page.screenshot({ path: path.join(OUT, "header_a11y_panel.png") });
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: /Try a Board|Experimentar/i }).click();
  await page.waitForURL(/calculadora-volume/);
  await page.screenshot({ path: path.join(OUT, "header_try_a_board.png") });

  // Welcome popup after 7s
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    sessionStorage.removeItem("jss_welcome_offer_dismissed_v1");
    sessionStorage.removeItem("jss_welcome_ribbon_hidden_v1");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("dialog").waitFor({ timeout: 12000 });
  await page.screenshot({ path: path.join(OUT, "welcome_popup_7s.png") });

  await page.getByRole("button", { name: /Not now|Agora não|稍后再说/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "free_shipping_ribbon.png") });

  await page.getByRole("button", { name: /Free Shipping/i }).first().click();
  await page.getByRole("dialog").waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(OUT, "welcome_popup_from_ribbon.png") });

  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (videoPath) {
    const dest = path.join(OUT, "firewire_header_welcome_demo.webm");
    fs.renameSync(videoPath, dest);
    console.log("video", dest);
  }
  console.log("OK screenshots written to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
