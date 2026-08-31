/**
 * Offline + HTTP checks for the post-payment thank-you page.
 * Run: cd website && npx tsx scripts/test-checkout-thanks.ts
 */
import { storefrontText } from "../src/lib/storefrontCopy.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(storefrontText("en").checkout.thanksTitle.includes("Thanks for shopping"), "EN thanks title");
assert(storefrontText("pt").checkout.thanksHome.toLowerCase().includes("inicial"), "PT homepage CTA");
assert(storefrontText("zh").checkout.thanksHome.includes("首页"), "ZH homepage CTA");

const base = process.env.LAUNCH_TEST_BASE_URL || "http://127.0.0.1:3001";

async function main() {
  const page = await fetch(`${base}/checkout/obrigado`);
  assert(page.ok, `thanks page HTTP ${page.status}`);
  const html = await page.text();
  assert(html.includes("CheckoutThanksClient") || html.includes("thanks") || html.includes("Obrigado") || html.includes("Thanks"), "thanks page rendered");

  const confirm = await fetch(`${base}/checkout/confirm?session_id=cs_test_thanks`, { redirect: "manual" });
  const location = confirm.headers.get("location") || "";
  assert(
    confirm.status === 307 || confirm.status === 308 || location.includes("/checkout/obrigado"),
    `confirm should redirect to thanks, got ${confirm.status} ${location}`
  );
  if (location) {
    assert(location.includes("/checkout/obrigado"), `confirm location ${location}`);
    assert(location.includes("session_id=cs_test_thanks"), "confirm keeps session_id");
  }

  const bad = await fetch(`${base}/api/checkout/thanks?orderId=x`);
  assert(bad.status === 400, `short orderId is 400, got ${bad.status}`);

  console.log("checkout thanks ok");
}

void main();
