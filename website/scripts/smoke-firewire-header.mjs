/**
 * GUI smoke for Firewire-style header + welcome FREE SHIPPING ribbon.
 * Run: cd website && node scripts/smoke-firewire-header.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "/tmp/ribbon-smoke";
fs.mkdirSync(OUT, { recursive: true });
const ARTIFACTS = "/opt/cursor/artifacts";
fs.mkdirSync(ARTIFACTS, { recursive: true });

const consentValue = encodeURIComponent(
  JSON.stringify({
    decisions: { required: true, analytics: true, personalization: true, marketing: true },
    policyVersion: "2026-07-ecommerce-foundation",
  })
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertMobileHeaderLayout(page) {
  const order = await page.evaluate(() => {
    const header = document.querySelector("[data-testid='site-header-bar']");
    if (!header) return null;
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, cx: r.left + r.width / 2, right: r.right, y: r.top };
    };
    const menu = header.querySelector("button[aria-label='Menu']");
    const a11y = [...header.querySelectorAll("button[aria-label='Accessibility']")].find(
      (el) => el.getClientRects().length
    );
    const logo = [...header.querySelectorAll("a[aria-label='Jhonny Surf Store']")].find(
      (el) => el.getClientRects().length
    );
    const lang = header.querySelector("button[aria-label='Change language']");
    const search = header.querySelector("button[aria-label='Search for…']");
    const cart = header.querySelector("button[aria-label='Cart']");
    if (!menu || !a11y || !logo || !lang || !search || !cart) {
      return {
        missing: {
          menu: !menu,
          a11y: !a11y,
          logo: !logo,
          lang: !lang,
          search: !search,
          cart: !cart,
        },
      };
    }
    return {
      viewport: window.innerWidth,
      menu: box(menu),
      a11y: box(a11y),
      logo: box(logo),
      lang: box(lang),
      search: box(search),
      cart: box(cart),
    };
  });

  assert(order && !order.missing, `mobile header missing controls: ${JSON.stringify(order)}`);
  assert(order.menu.x < order.a11y.x, "menu should be left of accessibility");
  assert(order.a11y.x < order.logo.x, "accessibility should be left of the logo");
  assert(order.logo.right < order.lang.x, "logo should be left of language");
  assert(order.lang.x < order.search.x, "language should be left of search");
  assert(order.search.x < order.cart.x, "search should be left of cart");
  assert(order.menu.x < 24, `menu should sit on the left edge (x=${order.menu.x})`);
  assert(
    Math.abs(order.logo.cx - order.viewport / 2) < 28,
    `logo should be centered (cx=${order.logo.cx}, vw=${order.viewport})`
  );
  assert(
    order.viewport - order.cart.right < 28,
    `cart should sit on the right edge (right=${order.cart.right}, vw=${order.viewport})`
  );
  console.log("mobile header layout OK", {
    left: `${order.menu.x.toFixed(0)} menu → ${order.a11y.x.toFixed(0)} a11y`,
    center: `logo ${order.logo.cx.toFixed(0)}`,
    right: `${order.lang.x.toFixed(0)} lang → ${order.search.x.toFixed(0)} search → ${order.cart.x.toFixed(0)} cart`,
  });
}

async function hideDevOverlays(page) {
  await page.addStyleTag({
    content:
      "nextjs-portal, [data-next-badge-root], [data-nextjs-dev-indicator] { display: none !important; }",
  });
}

async function showRibbon(page) {
  await page.evaluate(() => {
    sessionStorage.setItem("jss_welcome_offer_dismissed_v1", "1");
    sessionStorage.removeItem("jss_welcome_ribbon_hidden_v1");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await hideDevOverlays(page);
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
      visual: window.visualViewport
        ? {
            left: window.visualViewport.offsetLeft,
            top: window.visualViewport.offsetTop,
            width: window.visualViewport.width,
            height: window.visualViewport.height,
            bottom: window.visualViewport.offsetTop + window.visualViewport.height,
          }
        : null,
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
        content: (text.textContent || "").replace(/\s+/g, " ").trim(),
        left: textBox.left - widgetBox.left,
        right: textBox.right - widgetBox.left,
        top: textBox.top - widgetBox.top,
        bottom: textBox.bottom - widgetBox.top,
        centerX: textBox.left + textBox.width / 2 - widgetBox.left,
        centerY: textBox.top + textBox.height / 2 - widgetBox.top,
      },
    };
  });

  assert(geometry, `${label}: ribbon markup missing`);
  const { viewport, visual, widget, close, text } = geometry;
  const visibleBottom = visual?.bottom ?? viewport.height;
  const visibleLeft = visual?.left ?? 0;

  assert(
    Math.abs(widget.left - visibleLeft) <= 1,
    `${label}: widget left is ${widget.left}, expected ${visibleLeft}`
  );
  assert(widget.top >= 0, `${label}: widget is clipped at the top of the viewport (${widget.top})`);
  assert(
    Math.abs(widget.bottom - visibleBottom) <= 2,
    `${label}: widget bottom is ${widget.bottom}, visible bottom ${visibleBottom} — nothing should show under the triangle`
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
  // rotate(45deg) → matrix(a, b, c, d) with b > 0 (clockwise along the hypotenuse).
  const matrixMatch = text.transform.match(/matrix\(([-0-9.e]+),\s*([-0-9.e]+)/);
  if (matrixMatch) {
    const sin = Number(matrixMatch[2]);
    assert(sin > 0.5, `${label}: copy should rotate +45deg along the hypotenuse, got ${text.transform}`);
  } else {
    assert(/rotate\(45deg\)/.test(text.transform), `${label}: copy should rotate +45deg, got ${text.transform}`);
  }
  assert(/join/i.test(text.content) && /family/i.test(text.content), `${label}: missing JOIN THE FAMILY copy`);
  assert(text.left >= -2, `${label}: copy clipped on the left (${text.left})`);
  assert(text.top >= -2, `${label}: copy clipped on the top (${text.top})`);
  assert(text.right <= widget.width + 8, `${label}: copy overflows the right (${text.right} of ${widget.width})`);
  assert(text.bottom <= widget.height + 8, `${label}: copy overflows the bottom (${text.bottom} of ${widget.height})`);
  assert(
    Math.abs(text.centerX / widget.width - 0.333) < 0.12,
    `${label}: copy not centered in the triangle (cx ratio ${text.centerX / widget.width})`
  );
  assert(
    Math.abs(text.centerY / widget.height - 0.667) < 0.12,
    `${label}: copy not centered in the triangle (cy ratio ${text.centerY / widget.height})`
  );

  console.log(`geometry OK [${label}]`, {
    size: `${widget.width.toFixed(1)}x${widget.height.toFixed(1)}`,
    close: `${close.relX.toFixed(1)},${close.relY.toFixed(1)}`,
    textCenter: `${text.centerX.toFixed(1)},${text.centerY.toFixed(1)}`,
    copy: text.content,
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
  await hideDevOverlays(page);
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
    path: path.join(OUT, "ribbon_slide_join_the_family.png"),
  });

  const copyLocator = page.locator('[data-testid="ribbon-copy"]');
  assert(
    /join\s*the\s*family/i.test(((await copyLocator.innerText()) || "").replace(/\s+/g, " ")),
    "slide 1 should be JOIN THE FAMILY"
  );
  await page.locator('[data-testid="ribbon-copy"][data-slide="1"]').waitFor({ timeout: 8500 });
  assert(
    /receive\s*special\s*discounts/i.test(((await copyLocator.innerText()) || "").replace(/\s+/g, " ")),
    "slide 2 should be RECEIVE SPECIAL DISCOUNTS"
  );
  await page.locator('[data-testid="free-shipping-widget"]').screenshot({
    path: path.join(OUT, "ribbon_slide_receive_special_discounts.png"),
  });
  await page.locator('[data-testid="ribbon-copy"][data-slide="2"]').waitFor({ timeout: 8500 });
  assert(
    /get\s*jss\s*updates/i.test(((await copyLocator.innerText()) || "").replace(/\s+/g, " ")),
    "slide 3 should be GET JSS UPDATES"
  );
  await page.locator('[data-testid="free-shipping-widget"]').screenshot({
    path: path.join(OUT, "ribbon_slide_get_jss_updates.png"),
  });

  await page.getByRole("button", { name: /^Dismiss$/i }).click();
  await page.waitForTimeout(200);
  assert(
    (await page.locator('[data-testid="free-shipping-widget"]').count()) === 0,
    "dismiss did not hide the ribbon"
  );

  await showRibbon(page);
  await page.getByRole("button", { name: /Join the family/i }).first().click();
  await page.getByRole("dialog").waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(OUT, "welcome_popup_from_ribbon.png") });
  await page.getByRole("button", { name: /Not now|Agora não|稍后再说/i }).click();
  await page.locator('[data-testid="free-shipping-widget"]').waitFor({ timeout: 5000 });

  const wa = page.locator('[data-testid="whatsapp-float"]');
  await wa.waitFor({ timeout: 5000 });
  assert((await page.locator(".animate-bubble").count()) === 0, "WhatsApp speech bubble should be gone");
  assert((await page.locator(".jss-wa-toy, .surfer-toy").count()) === 0, "Jhonny toy should not appear on WhatsApp");
  const waBox = await wa.boundingBox();
  assert(
    waBox && waBox.width <= 40 && waBox.height <= 40,
    `WhatsApp badge should match the original 28px mark, got ${waBox?.width}x${waBox?.height}`
  );
  const waIcon = await wa.locator("svg").boundingBox();
  assert(
    waIcon && waIcon.width <= 18 && waIcon.height <= 18,
    `WhatsApp glyph should be the original h-4 size, got ${waIcon?.width}x${waIcon?.height}`
  );
  await wa.screenshot({ path: path.join(OUT, "whatsapp_icon_only.png") });
  await page.screenshot({ path: path.join(OUT, "whatsapp_original_badge.png") });

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
  await hideDevOverlays(mobilePage);
  const mobileA11y = mobilePage.locator("header button[aria-label='Accessibility']").filter({ visible: true });
  await mobileA11y.waitFor({ timeout: 8000 });
  await assertMobileHeaderLayout(mobilePage);
  await mobilePage.locator("[data-testid='site-header-bar']").screenshot({
    path: path.join(OUT, "header_mobile_firewire_layout.png"),
  });
  await mobilePage.screenshot({
    path: path.join(OUT, "header_mobile_firewire_full.png"),
  });
  await showRibbon(mobilePage);
  await assertRibbonGeometry(mobilePage, "mobile");
  await mobilePage.screenshot({ path: path.join(OUT, "free_shipping_ribbon_mobile.png") });
  await mobilePage.locator('[data-testid="free-shipping-widget"]').screenshot({
    path: path.join(OUT, "free_shipping_ribbon_mobile_closeup.png"),
  });
  await mobilePage.evaluate(() => window.scrollTo(0, 900));
  await mobilePage.waitForTimeout(200);
  await assertRibbonGeometry(mobilePage, "mobile mid-scroll");
  await mobilePage.screenshot({ path: path.join(OUT, "ribbon_flush_mobile_midscroll.png") });
  await mobilePage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await mobilePage.waitForTimeout(200);
  await assertRibbonGeometry(mobilePage, "mobile scrolled to end");
  await mobilePage.screenshot({ path: path.join(OUT, "ribbon_flush_mobile_scrolled.png") });
  await mobile.close();
  await browser.close();

  if (videoPath) {
    const dest = path.join(ARTIFACTS, "ribbon_flush_to_visible_bottom.webm");
    fs.copyFileSync(videoPath, dest);
    console.log("video", dest);
  }
  for (const name of [
    "ribbon_flush_mobile_midscroll.png",
    "ribbon_flush_mobile_scrolled.png",
    "free_shipping_ribbon_mobile.png",
    "free_shipping_ribbon_mobile_closeup.png",
  ]) {
    const src = path.join(OUT, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(ARTIFACTS, `vbottom_${name}`));
    }
  }
  console.log("OK screenshots written to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
