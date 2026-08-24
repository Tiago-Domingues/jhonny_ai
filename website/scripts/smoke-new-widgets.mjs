/**
 * GUI smoke for the three corner widgets: the ribbon prize wheel, the Jhonny
 * AI assistant placeholder, and the surfer that rides the ribbon.
 *
 * Requires playwright on the machine (not a repo dependency, same as
 * smoke-firewire-header.mjs): npm i -D playwright && npx playwright install chromium
 *
 * Run: cd website && node scripts/smoke-new-widgets.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "/tmp/widgets-smoke";
fs.mkdirSync(OUT, { recursive: true });

const SPIN_CODE = "RODA10";
/** Keep in sync with jss-ribbon-surf in globals.css: 10s loop, ride ends at 24%. */
const SURF_CYCLE_MS = 10000;

const consentValue = encodeURIComponent(
  JSON.stringify({
    decisions: { required: true, analytics: true, personalization: true, marketing: true },
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

async function newSession(browser, { viewport, isMobile = false, locale, reducedMotion } = {}) {
  const context = await browser.newContext({
    viewport,
    isMobile,
    ...(reducedMotion ? { reducedMotion: "reduce" } : {}),
  });
  context.setDefaultTimeout(15000);
  await context.addCookies([
    { name: "jss_consent", value: consentValue, domain: "localhost", path: "/" },
  ]);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate((chosen) => {
    // Skip the timed welcome modal so the ribbon renders straight away.
    sessionStorage.setItem("jss_welcome_offer_dismissed_v1", "1");
    sessionStorage.removeItem("jss_welcome_ribbon_hidden_v1");
    sessionStorage.removeItem("jss_spin_wheel_result_v1");
    localStorage.removeItem("jss_jhonny_assistant_seen_v1");
    if (chosen) localStorage.setItem("jss-locale-v2", chosen);
  }, locale);
  await page.reload({ waitUntil: "domcontentloaded" });
  await hideDevOverlays(page);
  await page.locator('[data-testid="free-shipping-widget"]').waitFor({ timeout: 10000 });
  return { context, page };
}

/** Rotate the ribbon to the "Get special discounts" slide. */
async function waitForDiscountSlide(page) {
  await page.locator('[data-testid="ribbon-copy"][data-slide="1"]').waitFor({ timeout: 12000 });
  const text = ((await page.locator('[data-testid="ribbon-copy"]').innerText()) || "").replace(
    /\s+/g,
    " "
  );
  assert(/get\s*special\s*discounts/i.test(text), `expected the discounts slide, got "${text}"`);
}

/**
 * Freeze the surfer at a chosen point of its loop. Scrubbing the animation via
 * the Web Animations API is the only deterministic way to measure a 2.4s pass;
 * inline animation-delay does not survive the ribbon's re-renders.
 */
async function freezeSurfer(page, progress) {
  return page.evaluate(
    ({ progress, cycle }) => {
      const surfer = document.querySelector("[data-testid='ribbon-surfer']");
      const widget = document.querySelector("[data-testid='free-shipping-widget']");
      if (!surfer || !widget) return null;

      const animation = surfer.getAnimations()[0];
      if (!animation) return null;
      animation.pause();
      animation.currentTime = progress * cycle;

      const box = surfer.getBoundingClientRect();
      const widgetBox = widget.getBoundingClientRect();
      const style = window.getComputedStyle(surfer);

      // The traveller pivots on its bottom centre, so the bounding box centre
      // is not the contact point. Rebuild the pivot from the layout position,
      // the transform-origin and the matrix translation.
      const matrix = new DOMMatrix(style.transform);
      const [originX, originY] = style.transformOrigin.split(" ").map(parseFloat);

      return {
        opacity: Number(style.opacity),
        pointerEvents: style.pointerEvents,
        anchorX: surfer.offsetLeft + originX + matrix.e,
        anchorY: surfer.offsetTop + originY + matrix.f,
        widgetSize: widgetBox.width,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        boxLeft: box.left,
        boxTop: box.top,
        boxRight: box.right,
        boxBottom: box.bottom,
      };
    },
    { progress, cycle: SURF_CYCLE_MS }
  );
}

async function unfreezeSurfer(page) {
  await page.evaluate(() => {
    const surfer = document.querySelector("[data-testid='ribbon-surfer']");
    surfer?.getAnimations()[0]?.play();
  });
}

async function assertSurferRidesTheEdge(page, label) {
  const surfer = page.locator('[data-testid="ribbon-surfer"]');
  assert((await surfer.count()) === 1, `${label}: surfer should be mounted with the ribbon`);

  // Sample across the ride: the anchor must track the 45-degree hypotenuse.
  for (const progress of [0.06, 0.12, 0.18]) {
    const frame = await freezeSurfer(page, progress);
    assert(frame !== null, `${label}: could not measure the surfer at ${progress}`);
    assert(
      frame.pointerEvents === "none",
      `${label}: surfer must stay click-transparent, got ${frame.pointerEvents}`
    );
    assert(frame.opacity > 0.5, `${label}: surfer should be visible mid-ride at ${progress}`);

    const drift = Math.abs(frame.anchorX - frame.anchorY);
    assert(
      drift < frame.widgetSize * 0.16,
      `${label}: surfer left the hypotenuse at ${progress} (x=${frame.anchorX.toFixed(1)}, y=${frame.anchorY.toFixed(1)})`
    );
    assert(
      frame.anchorX >= -4 && frame.anchorX <= frame.widgetSize + 4,
      `${label}: surfer travelled outside the triangle at ${progress} (x=${frame.anchorX.toFixed(1)}, size=${frame.widgetSize})`
    );
    assert(
      frame.boxLeft > -60 &&
        frame.boxTop > -60 &&
        frame.boxRight < frame.viewportWidth + 60 &&
        frame.boxBottom < frame.viewportHeight + 60,
      `${label}: surfer drifted off-screen at ${progress}`
    );
  }

  // The gap between passes: he must be fully gone, not parked mid-air.
  const resting = await freezeSurfer(page, 0.6);
  assert(resting.opacity < 0.01, `${label}: surfer should be invisible between passes`);
  await unfreezeSurfer(page);
}

async function assertBottomRightStack(page, label) {
  const bubble = page.locator('[data-testid="jhonny-assistant-bubble"]');
  await bubble.waitFor({ timeout: 8000 });
  const bubbleBox = await bubble.boundingBox();
  assert(bubbleBox, `${label}: assistant bubble should be laid out`);

  const whatsapp = page.locator('[data-testid="whatsapp-float"]');
  if ((await whatsapp.count()) > 0) {
    const waBox = await whatsapp.boundingBox();
    const overlaps =
      waBox.x < bubbleBox.x + bubbleBox.width &&
      waBox.x + waBox.width > bubbleBox.x &&
      waBox.y < bubbleBox.y + bubbleBox.height &&
      waBox.y + waBox.height > bubbleBox.y;
    assert(!overlaps, `${label}: WhatsApp float must not overlap the Jhonny bubble`);
    assert(
      waBox.y + waBox.height <= bubbleBox.y + 1,
      `${label}: WhatsApp float should stack above the bubble`
    );
  }

  // The bottom-left ribbon and the bottom-right bubble must not collide.
  const widgetBox = await page.locator('[data-testid="free-shipping-widget"]').boundingBox();
  assert(
    widgetBox.x + widgetBox.width <= bubbleBox.x,
    `${label}: corner ribbon and assistant bubble overlap`
  );
}

async function runWheel(page, { reduced = false, label = "desktop" } = {}) {
  await waitForDiscountSlide(page);
  await page.locator(".jss-free-shipping-ribbon").click();

  const wheel = page.locator('[data-testid="prize-wheel"]');
  await wheel.waitFor({ timeout: 6000 });
  assert(true, `${label}: discounts slide opened the prize wheel`);

  const segmentCount = await page.locator('[data-testid="prize-wheel"] svg path[fill]').count();
  assert(segmentCount >= 8, `${label}: expected 8 wedges, found ${segmentCount}`);

  const spin = page.locator('[data-testid="prize-wheel-spin"]');
  await spin.waitFor({ timeout: 4000 });
  await spin.click();

  const code = page.locator('[data-testid="prize-wheel-code"]');
  await code.waitFor({ timeout: reduced ? 2000 : 9000 });
  const won = (await code.innerText()).trim();
  assert(won === SPIN_CODE, `${label}: expected ${SPIN_CODE}, got ${won}`);

  const parked = await page.evaluate(() => {
    const spinner = document.querySelector(".jss-wheel-spinner");
    const transform = window.getComputedStyle(spinner).transform;
    const match = /matrix\(([^,]+),\s*([^,]+)/.exec(transform);
    if (!match) return null;
    const angle = (Math.atan2(Number(match[2]), Number(match[1])) * 180) / Math.PI;
    return ((angle % 360) + 360) % 360;
  });
  // Landing centres a wedge on the 12 o'clock pointer: always an odd half-step.
  const offset = Math.abs((((parked + 22.5) % 45) + 45) % 45);
  assert(
    offset < 1 || Math.abs(offset - 45) < 1,
    `${label}: wheel did not park a wedge under the pointer (angle=${parked?.toFixed(2)})`
  );

  // Let the win outline and prize reveal settle before anything is captured.
  await page.waitForTimeout(1000);
  return wheel;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ── Desktop: full journey through all three widgets ──────────────────
  step("desktop: booting");
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  });
  desktop.setDefaultTimeout(15000);
  await desktop.addCookies([
    { name: "jss_consent", value: consentValue, domain: "localhost", path: "/" },
  ]);
  const page = await desktop.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    sessionStorage.setItem("jss_welcome_offer_dismissed_v1", "1");
    sessionStorage.removeItem("jss_welcome_ribbon_hidden_v1");
    sessionStorage.removeItem("jss_spin_wheel_result_v1");
    localStorage.removeItem("jss_jhonny_assistant_seen_v1");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await hideDevOverlays(page);
  await page.locator('[data-testid="free-shipping-widget"]').waitFor({ timeout: 10000 });

  step("desktop: bottom-right stack");
  await assertBottomRightStack(page, "desktop");
  await page.screenshot({ path: path.join(OUT, "bottom_right_stack_desktop.png") });

  step("desktop: surfer path");
  await assertSurferRidesTheEdge(page, "desktop");
  await freezeSurfer(page, 0.12);
  await page.locator('[data-testid="free-shipping-widget"]').screenshot({
    path: path.join(OUT, "surfer_midride_desktop.png"),
  });
  await unfreezeSurfer(page);

  // Wheel opens only from the discounts slide.
  step("desktop: prize wheel");
  const wheel = await runWheel(page, { label: "desktop" });
  await page.screenshot({ path: path.join(OUT, "prize_wheel_prize_desktop.png") });
  await page.locator('[data-testid="prize-wheel-card"]').screenshot({ path: path.join(OUT, "prize_wheel_card.png") });
  await page.locator('[data-testid="prize-wheel-close"]').click();
  await wheel.waitFor({ state: "detached", timeout: 4000 });

  // Re-opening in the same session shows the stored prize, not a fresh spin.
  await waitForDiscountSlide(page);
  await page.locator(".jss-free-shipping-ribbon").click();
  await page.locator('[data-testid="prize-wheel-code"]').waitFor({ timeout: 4000 });
  assert(
    (await page.locator('[data-testid="prize-wheel-spin"]').count()) === 0,
    "desktop: a second visit should not offer another spin"
  );
  await page.locator('[data-testid="prize-wheel-close"]').click();
  await wheel.waitFor({ state: "detached", timeout: 4000 });

  // Other slides must still open the welcome modal.
  await page.locator('[data-testid="ribbon-copy"][data-slide="2"]').waitFor({ timeout: 12000 });
  await page.locator(".jss-free-shipping-ribbon").click();
  await page.getByRole("dialog").waitFor({ timeout: 5000 });
  assert(
    (await page.locator('[data-testid="prize-wheel"]').count()) === 0,
    "desktop: non-discount slides must not open the wheel"
  );
  const welcomeModal = page.locator('[aria-labelledby="welcome-offer-title"]');
  await welcomeModal.locator("button[aria-label='Close']").click();
  await welcomeModal.waitFor({ state: "detached", timeout: 5000 });

  // ── Assistant ────────────────────────────────────────────────────────
  step("desktop: assistant");
  await page.locator('[data-testid="jhonny-assistant-bubble"]').click();
  const panel = page.locator('[data-testid="jhonny-assistant-panel"]');
  await panel.waitFor({ timeout: 4000 });
  await page.waitForTimeout(1200);

  const composer = panel.locator("input[type='text']");
  assert(await composer.isDisabled(), "desktop: the placeholder composer must be disabled");
  assert(
    /Jhonny AI/i.test(await panel.innerText()),
    "desktop: the panel should introduce Jhonny AI"
  );
  assert(
    (await panel.locator("a[href*='wa.me']").count()) === 1,
    "desktop: the panel should offer the WhatsApp fallback"
  );
  await page.screenshot({ path: path.join(OUT, "assistant_panel_desktop.png") });
  await panel.screenshot({ path: path.join(OUT, "assistant_panel_closeup.png") });

  await page.keyboard.press("Escape");
  await panel.waitFor({ state: "detached", timeout: 4000 });
  const focusedAfterClose = await page.evaluate(
    () => document.activeElement?.getAttribute("data-testid") || ""
  );
  assert(
    focusedAfterClose === "jhonny-assistant-bubble",
    `desktop: focus should return to the bubble, went to "${focusedAfterClose}"`
  );

  const videoPath = await page.video()?.path();
  await desktop.close();
  if (videoPath) {
    fs.renameSync(videoPath, path.join(OUT, "widgets_walkthrough_desktop.webm"));
  }

  // ── Mobile ───────────────────────────────────────────────────────────
  step("mobile: booting");
  const { context: mobileCtx, page: mobile } = await newSession(browser, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  await assertBottomRightStack(mobile, "mobile");
  await assertSurferRidesTheEdge(mobile, "mobile");
  await runWheel(mobile, { label: "mobile" });
  await mobile.screenshot({ path: path.join(OUT, "prize_wheel_mobile.png") });
  await mobile.locator('[data-testid="prize-wheel-close"]').click();

  await mobile.locator('[data-testid="jhonny-assistant-bubble"]').click();
  const mobilePanel = mobile.locator('[data-testid="jhonny-assistant-panel"]');
  await mobilePanel.waitFor({ timeout: 4000 });
  await mobile.waitForTimeout(1200);
  const panelBox = await mobilePanel.boundingBox();
  assert(
    panelBox.x >= 0 && panelBox.x + panelBox.width <= 390,
    `mobile: the panel overflows the viewport (x=${panelBox.x}, w=${panelBox.width})`
  );
  assert(panelBox.height <= 844 * 0.7 + 2, "mobile: the panel should stay within 70vh");
  await mobile.screenshot({ path: path.join(OUT, "assistant_panel_mobile.png") });
  await mobileCtx.close();

  // ── Tablet ───────────────────────────────────────────────────────────
  step("tablet: booting");
  const { context: tabletCtx, page: tablet } = await newSession(browser, {
    viewport: { width: 768, height: 1024 },
  });
  await assertBottomRightStack(tablet, "tablet");
  await runWheel(tablet, { label: "tablet" });
  await tablet.screenshot({ path: path.join(OUT, "prize_wheel_tablet.png") });
  await tabletCtx.close();

  // ── Reduced motion: still complete, just instant ─────────────────────
  // The ribbon deliberately stops rotating under reduced motion (pre-existing
  // behaviour), so reach the discounts slide first and switch the preference on
  // afterwards. That is also what a user toggling the accessibility panel
  // mid-session experiences.
  step("reduced motion: booting");
  const { context: calmCtx, page: calm } = await newSession(browser, {
    viewport: { width: 1440, height: 900 },
  });
  await waitForDiscountSlide(calm);
  await calm.emulateMedia({ reducedMotion: "reduce" });

  assert(
    await calm.evaluate(() => {
      const surfer = document.querySelector("[data-testid='ribbon-surfer']");
      return surfer ? window.getComputedStyle(surfer).display === "none" : true;
    }),
    "reduced motion: the surfer should not run"
  );

  await calm.locator(".jss-free-shipping-ribbon").click();
  await calm.locator('[data-testid="prize-wheel"]').waitFor({ timeout: 6000 });
  const startedSpin = Date.now();
  await calm.locator('[data-testid="prize-wheel-spin"]').click();
  await calm.locator('[data-testid="prize-wheel-code"]').waitFor({ timeout: 3000 });
  const elapsed = Date.now() - startedSpin;
  assert(
    elapsed < 2000,
    `reduced motion: the wheel should resolve immediately, took ${elapsed}ms`
  );
  assert(
    (await calm.locator('[data-testid="prize-wheel-code"]').innerText()).trim() === SPIN_CODE,
    "reduced motion: the prize should still be awarded"
  );
  await calm.screenshot({ path: path.join(OUT, "reduced_motion_prize_wheel.png") });
  await calm.locator('[data-testid="prize-wheel-close"]').click();
  await calm.locator('[data-testid="prize-wheel"]').waitFor({ state: "detached", timeout: 4000 });

  await calm.locator('[data-testid="jhonny-assistant-bubble"]').click();
  const calmPanel = calm.locator('[data-testid="jhonny-assistant-panel"]');
  await calmPanel.waitFor({ timeout: 4000 });
  assert(
    /Jhonny AI/i.test(await calmPanel.innerText()),
    "reduced motion: the greeting should appear without the typing delay"
  );
  await calm.screenshot({ path: path.join(OUT, "reduced_motion_assistant.png") });
  await calmCtx.close();

  // ── Locales ──────────────────────────────────────────────────────────
  for (const [locale, pattern] of [
    ["pt", /Gira e ganha/i],
    ["zh", /转动赢好礼/],
  ]) {
    const { context, page: localised } = await newSession(browser, {
      viewport: { width: 1440, height: 900 },
      locale,
    });
    await waitForDiscountSlide(localised);
    await localised.locator(".jss-free-shipping-ribbon").click();
    await localised.locator('[data-testid="prize-wheel"]').waitFor({ timeout: 6000 });
    await localised.waitForTimeout(600); // let the entrance settle before capturing
    const heading = await localised.locator("#prize-wheel-title").innerText();
    assert(pattern.test(heading), `${locale}: unexpected wheel heading "${heading}"`);

    const overflow = await localised.evaluate(() => {
      const card = document.querySelector("[data-testid='prize-wheel-card']");
      return card ? card.scrollWidth - card.clientWidth : null;
    });
    assert(overflow !== null, `${locale}: could not find the wheel card to measure`);
    assert(overflow <= 1, `${locale}: the wheel card overflows horizontally by ${overflow}px`);
    await localised.screenshot({ path: path.join(OUT, `prize_wheel_${locale}.png`) });

    await localised.locator('[data-testid="prize-wheel-close"]').click();
    await localised.locator('[data-testid="jhonny-assistant-bubble"]').click();
    await localised.locator('[data-testid="jhonny-assistant-panel"]').waitFor({ timeout: 4000 });
    await localised.waitForTimeout(1200);
    await localised.screenshot({ path: path.join(OUT, `assistant_panel_${locale}.png`) });
    await context.close();
  }

  await browser.close();
  console.log(`\nAll widget smoke checks passed (${checks} assertions).`);
  console.log(`Artifacts in ${OUT}`);
}

main().catch((error) => {
  console.error("\nSMOKE FAILED:", error.message.split("\n").slice(0, 6).join("\n"));
  console.error(error.stack?.split("\n").slice(0, 8).join("\n"));
  process.exitCode = 1;
  process.exit(1);
});
