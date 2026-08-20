/**
 * GUI smoke for Firewire-style header + welcome FREE SHIPPING ribbon.
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function showRibbon(page) {
  await page.evaluate(() => {
    sessionStorage.setItem("jss_welcome_offer_dismissed_v1", "1");
    sessionStorage.removeItem("jss_welcome_ribbon_hidden_v1");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="free-shipping-widget"]').waitFor({ timeout: 8000 });
}

async function assertRibbonGeometry(page, label) {
  const geometry = await page.evaluate(() => {
    const widget = document.querySelector("[data-testid='free-shipping-widget']");
    const close = document.querySelector(".jss-free-shipping-close");
    const text = document.querySelector(".jss-free-shipping-ribbon__text");
    if (!widget || !close || !text) return null;

    const widgetBox = widget.getBoundingClientRect();
    const closeBox = close.getBoundingClientRect();
    const textBox = text.getBoundingClientRect();
    const closeCx = closeBox.left + closeBox.width / 2;
    const closeCy = closeBox.top + closeBox.height / 2;
    const relX = closeCx - widgetBox.left;
    const relY = closeCy - widgetBox.top;
    const textStyle = getComputedStyle(text);
    const closeStyle = getComputedStyle(close);

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      widget: {
        left: widgetBox.left,
        top: widgetBox.top,
        right: widgetBox.right,
        bottom: widgetBox.bottom,
        width: widgetBox.width,
        height: widgetBox.height,
      },
      close: {
        relX,
        relY,
        width: closeBox.width,
        height: closeBox.height,
        borderTopWidth: closeStyle.borderTopWidth,
        background: closeStyle.backgroundColor,
        radius: closeStyle.borderRadius,
      },
      text: {
        transform: textStyle.transform,
        fontWeight: textStyle.fontWeight,
        textTransform: textStyle.textTransform,
        color: textStyle.color,
        centerX: textBox.left + textBox.width / 2 - widgetBox.left,
        centerY: textBox.top + textBox.height / 2 - widgetBox.top,
      },
    };
  });

  assert(geometry, `${label}: ribbon markup missing`);
  const { viewport, widget, close, text } = geometry;

  assert(Math.abs(widget.left) <= 1, `${label}: widget left is ${widget.left}, expected 0`);
  assert(
    Math.abs(widget.bottom - viewport.height) <= 2,
    `${label}: widget bottom is ${widget.bottom}, viewport ${viewport.height}`
  );
  assert(
    Math.abs(widget.width - widget.height) <= 1,
    `${label}: widget is not square (${widget.width}x${widget.height})`
  );

  const hypotenuseDelta = Math.abs(close.relX - close.relY);
  assert(
    hypotenuseDelta <= 4,
    `${label}: close button is off the hypotenuse (rel ${close.relX.toFixed(1)}, ${close.relY.toFixed(1)})`
  );
  assert(
    close.relX > widget.width * 0.7,
    `${label}: close button is not towards the lower-right (${close.relX} of ${widget.width})`
  );
  assert(
    close.relX < widget.width * 0.95,
    `${label}: close button is past the triangle corner (${close.relX} of ${widget.width})`
  );
  assert(Math.abs(close.width - close.height) <= 1, `${label}: close button is not circular`);
  assert(parseFloat(close.borderTopWidth) >= 0.5, `${label}: close button missing white border`);

  assert(text.textTransform === "uppercase", `${label}: copy is not uppercase`);
  assert(Number(text.fontWeight) >= 700, `${label}: copy is not bold`);
  assert(
    text.transform.includes("matrix") || text.transform.includes("rotate"),
    `${label}: copy is not rotated (${text.transform})`
  );

  console.log(`geometry OK [${label}]`, {
    size: `${widget.width.toFixed(1)}x${widget.height.toFixed(1)}`,
    close: `${close.relX.toFixed(1)},${close.relY.toFixed(1)}`,
    textCenter: `${text.centerX.toFixed(1)},${text.centerY.toFixed(1)}`,
  });
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

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    sessionStorage.setItem("jss_welcome_offer_dismissed_v1", "1");
    sessionStorage.setItem("jss_welcome_ribbon_hidden_v1", "1");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  const desktopA11y = page.locator("header button[aria-label='Accessibility']").filter({ visible: true });
  await desktopA11y.waitFor({ timeout: 8000 });
  await page.locator("header").first().screenshot({
    path: path.join(OUT, "header_accessibility_icon_desktop.png"),
  });
  await desktopA11y.screenshot({
    path: path.join(OUT, "header_accessibility_icon_desktop_closeup.png"),
  });

  await showRibbon(page);
  await assertRibbonGeometry(page, "desktop");
  await page.screenshot({ path: path.join(OUT, "free_shipping_ribbon_desktop.png") });
  await page.locator('[data-testid="free-shipping-widget"]').screenshot({
    path: path.join(OUT, "free_shipping_ribbon_desktop_closeup.png"),
  });

  await page.getByRole("button", { name: /^Dismiss$/i }).click();
  await page.waitForTimeout(200);
  assert(
    (await page.locator('[data-testid="free-shipping-widget"]').count()) === 0,
    "dismiss did not hide the ribbon"
  );

  await showRibbon(page);
  await page.getByRole("button", { name: /Free Shipping/i }).first().click();
  await page.getByRole("dialog").waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(OUT, "welcome_popup_from_ribbon.png") });
  await page.getByRole("button", { name: /Not now|Agora não|稍后再说/i }).click();
  await page.locator('[data-testid="free-shipping-widget"]').waitFor({ timeout: 5000 });

  const videoPath = await page.video()?.path();
  await context.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  await mobile.addCookies([
    { name: "jss_consent", value: consentValue, domain: "localhost", path: "/" },
  ]);
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await mobilePage.evaluate(() => {
    sessionStorage.setItem("jss_welcome_offer_dismissed_v1", "1");
    sessionStorage.setItem("jss_welcome_ribbon_hidden_v1", "1");
  });
  await mobilePage.reload({ waitUntil: "domcontentloaded" });
  const mobileA11y = mobilePage.locator("header button[aria-label='Accessibility']").filter({ visible: true });
  await mobileA11y.waitFor({ timeout: 8000 });
  await mobilePage.locator("header").first().screenshot({
    path: path.join(OUT, "header_accessibility_icon_mobile.png"),
  });
  await mobileA11y.screenshot({
    path: path.join(OUT, "header_accessibility_icon_mobile_closeup.png"),
  });
  await showRibbon(mobilePage);
  await assertRibbonGeometry(mobilePage, "mobile");
  await mobilePage.screenshot({ path: path.join(OUT, "free_shipping_ribbon_mobile.png") });
  await mobilePage.locator('[data-testid="free-shipping-widget"]').screenshot({
    path: path.join(OUT, "free_shipping_ribbon_mobile_closeup.png"),
  });
  await mobile.close();
  await browser.close();

  if (videoPath) {
    const dest = path.join(OUT, "firewire_free_shipping_ribbon_demo.webm");
    fs.renameSync(videoPath, dest);
    console.log("video", dest);
  }
  console.log("OK screenshots written to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
