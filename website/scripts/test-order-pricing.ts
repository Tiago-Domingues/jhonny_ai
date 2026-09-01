import { allocateDiscountCents, checkoutTotalCents, couponFaturaNote, lineDiscountPercent, percentOffDiscountCents } from "../src/lib/ecommerce/orderPricing";
import { aggregateCouponUsages } from "../src/lib/ecommerce/couponAnalytics";
import { isValidIsoDate, daysInMonth } from "../src/lib/ecommerce/birthDate";
import { createHash } from "node:crypto";
import { registerSchema } from "../src/lib/ecommerce/schemas";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const lines = allocateDiscountCents(
  [
    { name: "Wetsuit", totalCents: 12000 },
    { name: "Wax", totalCents: 1600 },
  ],
  1360
);
assert(lines[0].netCents + lines[1].netCents === 12000 + 1600 - 1360, "allocated nets equal subtotal minus coupon");
assert(checkoutTotalCents({ subtotalCents: 13600, shippingCents: 690, discountCents: 1360 }) === 12930, "checkout total includes shipping after coupon");
assert(lineDiscountPercent(10000, 9000) === 10, "10% line discount is 10.00");
assert(couponFaturaNote({ couponCode: "JHONNY10", couponPercentOff: 10, couponLabel: "Welcome" }) === "Cupão JHONNY10 (-10%): Welcome", "fatura note names the coupon");

const fullCart = 100_000;
const halfCart = 50_000;
const staleTenPercent = percentOffDiscountCents(fullCart, 10);
assert(staleTenPercent === 10_000, "10% of €1000 is €100");
assert(percentOffDiscountCents(halfCart, 10) === 5_000, "10% of €500 is €50 after items are removed");
assert(
  checkoutTotalCents({ subtotalCents: halfCart, shippingCents: 0, discountCents: staleTenPercent }) === 40_000,
  "stale snapshot would still subtract €100 from a €500 cart"
);
assert(
  checkoutTotalCents({
    subtotalCents: halfCart,
    shippingCents: 0,
    discountCents: percentOffDiscountCents(halfCart, 10),
  }) === 45_000,
  "live percent-off follows the smaller cart"
);
assert(percentOffDiscountCents(0, 10) === 0, "empty cart has no coupon discount");
assert(percentOffDiscountCents(1_234, 10) === 123, "discount never exceeds a percent of the live subtotal");

const coupons = aggregateCouponUsages([
  { code: "JHONNY10", discountCents: 1000, createdAt: new Date("2026-08-01"), label: "Welcome", percentOff: 10 },
  { code: "JHONNY10", discountCents: 800, createdAt: new Date("2026-08-20"), label: "Welcome", percentOff: 10 },
  { code: "FRANCISCO", discountCents: 500, createdAt: new Date("2026-08-10"), label: "Athlete", percentOff: 15 },
]);
assert(coupons[0].code === "JHONNY10" && coupons[0].count === 2, "paid coupon uses are counted per code");
assert(coupons[0].discountCents === 1800, "discount totals add up");

assert(isValidIsoDate("1998-05-12"), "valid birthday is accepted");
assert(!isValidIsoDate("1998-02-31"), "31 Feb is rejected");
assert(daysInMonth(2024, 2) === 29, "leap year February has 29 days");

const hashed = createHash("sha256").update("reset-token-value").digest("hex");
assert(hashed !== "reset-token-value" && hashed.length === 64, "reset tokens are stored hashed");

const registered = registerSchema.parse({
  email: "ana@example.com",
  username: "ana.silva",
  password: "surflegend",
  fullName: "Ana Silva",
  birthDate: "1998-05-12",
});
assert(registered.birthDate === "1998-05-12", "register requires a real birthday");
assert(
  !registerSchema.safeParse({
    email: "ana@example.com",
    username: "ana.silva",
    password: "surflegend",
    fullName: "Ana Silva",
    birthDate: "1998-02-31",
  }).success,
  "register rejects impossible birthdays"
);

console.log("pricing, coupon analytics, birthday and token checks passed");
