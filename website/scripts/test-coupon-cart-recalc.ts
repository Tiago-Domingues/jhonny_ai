/**
 * Coupon discount must follow the live cart after items are removed.
 * Run: cd website && npx tsx scripts/test-coupon-cart-recalc.ts
 *
 * Requires the website dev server (LAUNCH_TEST_BASE_URL, default http://127.0.0.1:3001).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { percentOffDiscountCents } from "../src/lib/ecommerce/orderPricing.ts";

dotenv.config({ path: ".env.local" });
dotenv.config();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function mergeCookies(previous: string, response: Response) {
  const jar = new Map<string, string>();
  for (const part of previous.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie") as string]
        : [];
  for (const header of setCookies) {
    const first = header.split(";")[0] || "";
    const eq = first.indexOf("=");
    if (eq <= 0) continue;
    const name = first.slice(0, eq).trim();
    const value = first.slice(eq + 1).trim();
    if (!name) continue;
    if (header.toLowerCase().includes("max-age=0") || value === "") jar.delete(name);
    else jar.set(name, value);
  }
  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function main() {
  const base = (process.env.LAUNCH_TEST_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const stamp = Date.now().toString(36);
  const email = `recalc-${stamp}@example.com`;
  const username = `recalc${stamp}`.slice(0, 32);
  const couponCode = `RECALC10${stamp}`.slice(0, 20).toUpperCase();
  let cookie = "";
  let userId: string | null = null;

  try {
    await prisma.coupon.create({
      data: {
        code: couponCode,
        label: "Cart recalc test 10%",
        percentOff: 10,
        active: true,
      },
    });

    const register = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ email, username, password: "surflegend1" }),
    });
    const registerBody = await register.json().catch(() => ({}));
    assert(register.ok, `register failed ${register.status} ${JSON.stringify(registerBody)}`);
    cookie = mergeCookies(cookie, register);
    userId = registerBody.user?.id || null;
    assert(cookie.includes("jss_session"), "register sets a session");

    const catalog = await fetch(`${base}/api/products?limit=40`);
    const catalogBody = await catalog.json();
    const products = (catalogBody.products || []).filter(
      (product: { id?: string; availableForSale?: boolean; stockQuantity?: number; priceCents?: number }) =>
        product.availableForSale !== false && (product.stockQuantity || 0) > 0 && (product.priceCents || 0) > 0
    );
    assert(products.length >= 2, "need two in-stock products");
    const first = products[0];
    const second = products.find((product: { priceCents?: number }) => product.priceCents !== first.priceCents) || products[1];

    async function add(productId: string) {
      const response = await fetch(`${base}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie, Origin: base },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const body = await response.json().catch(() => ({}));
      assert(response.ok, `add cart failed ${response.status} ${JSON.stringify(body)}`);
      cookie = mergeCookies(cookie, response);
      return body.cart;
    }

    const fullCart = await add(first.id);
    const fullCartAfterSecond = await add(second.id);
    const fullSubtotal = Number(fullCartAfterSecond.subtotalCents || 0);
    assert(fullCartAfterSecond.items.length >= 2, "cart has both products");
    assert(fullSubtotal > (fullCart.subtotalCents || 0), "second product increased the subtotal");

    const appliedFull = await fetch(`${base}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, Origin: base },
      body: JSON.stringify({ code: couponCode }),
    });
    const appliedFullBody = await appliedFull.json().catch(() => ({}));
    assert(appliedFull.ok, `validate on full cart failed ${appliedFull.status} ${JSON.stringify(appliedFullBody)}`);
    const fullDiscount = Number(appliedFullBody.discountCents || 0);
    assert(fullDiscount === percentOffDiscountCents(fullSubtotal, 10), "full-cart discount is 10% of the live subtotal");
    assert(fullDiscount > 0, "full cart earned a discount");

    const dropItem = fullCartAfterSecond.items.find((item: { productId?: string; id?: string; totalCents?: number }) => {
      return item.totalCents && item.totalCents !== fullSubtotal;
    }) || fullCartAfterSecond.items[1];
    const patch = await fetch(`${base}/api/cart`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie, Origin: base },
      body: JSON.stringify({ itemId: dropItem.id, quantity: 0 }),
    });
    const patchBody = await patch.json().catch(() => ({}));
    assert(patch.ok, `remove cart item failed ${patch.status} ${JSON.stringify(patchBody)}`);
    const halfSubtotal = Number(patchBody.cart?.subtotalCents || 0);
    assert(halfSubtotal > 0, "cart still has a remaining product");
    assert(halfSubtotal < fullSubtotal, "removing a product shrinks the subtotal");

    const appliedHalf = await fetch(`${base}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, Origin: base },
      body: JSON.stringify({ code: couponCode }),
    });
    const appliedHalfBody = await appliedHalf.json().catch(() => ({}));
    assert(appliedHalf.ok, `validate on smaller cart failed ${appliedHalf.status} ${JSON.stringify(appliedHalfBody)}`);
    const liveDiscount = Number(appliedHalfBody.discountCents || 0);
    assert(liveDiscount === percentOffDiscountCents(halfSubtotal, 10), "smaller cart discount is 10% of the new subtotal");
    assert(liveDiscount < fullDiscount, "discount shrinks when products are dropped");
    assert(liveDiscount !== fullDiscount, "must not keep the previous euro discount");
    assert(
      halfSubtotal - fullDiscount !== halfSubtotal - liveDiscount,
      "stale € discount would change the payable total vs the live percent"
    );

    console.log(
      JSON.stringify({
        ok: true,
        couponCode,
        fullSubtotal,
        fullDiscount,
        halfSubtotal,
        liveDiscount,
      })
    );
  } finally {
    if (userId) {
      await prisma.cart.deleteMany({ where: { userId } }).catch(() => undefined);
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    }
    await prisma.coupon.deleteMany({ where: { code: couponCode } }).catch(() => undefined);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
