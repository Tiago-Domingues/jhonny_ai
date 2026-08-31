/**
 * Offline catalog hygiene + payload-cap checks.
 * Run: cd website && npx tsx scripts/test-catalog-hygiene.ts
 */
import {
  isFoodBeverageCatalogRow,
  isMockProductIdentity,
  parseCatalogLimit,
  shouldExcludeFromWebsiteCatalog,
} from "../src/lib/ecommerce/catalogIdentity.ts";
import { MAX_PRODUCT_IMAGES } from "../src/lib/ecommerce/odooProductImages.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(isMockProductIdentity({ sku: "DEMO-RATED-1" }), "DEMO- SKU is mock");
assert(isMockProductIdentity({ slug: "rated-board-demo" }), "-demo slug is mock");
assert(isMockProductIdentity({ id: "mock-surfboard-performance" }), "mock- id is mock");
assert(!isMockProductIdentity({ sku: "JSS-TEE-01", slug: "jss-tee" }), "real SKU stays public");
assert(isMockProductIdentity({ sku: "demo-rated-1" }), "DEMO- match is case-insensitive");

assert(isFoodBeverageCatalogRow({ name: "Dudes espresso", category: "Cafe", brand: "Dudes" }), "cafe is excluded");
assert(isFoodBeverageCatalogRow({ name: "CAPUCCINO", category: "Bar", brand: "Jhonny Surf Store" }), "typo cappuccino is excluded");
assert(isFoodBeverageCatalogRow({ name: "Down Payment", category: "Services", brand: "JSS" }), "down payment is excluded");
assert(isFoodBeverageCatalogRow({ name: "EXPRESSO", category: "All", brand: "JSS" }), "standalone expresso drink is excluded");
assert(isFoodBeverageCatalogRow({ name: "FLAT WHITE", category: "All", brand: "JSS" }), "standalone flat white is excluded");
assert(
  !isFoodBeverageCatalogRow({
    name: "BACKPACK DB HUGGER - 25L (EXPRESSO)",
    category: "TRAVEL / BACKPACKS",
    brand: "DB",
  }),
  "DB Expresso colorway stays public"
);
assert(!isFoodBeverageCatalogRow({ name: "Pukas Dark", category: "SURFBOARDS", brand: "Pukas" }), "boards stay public");

assert(shouldExcludeFromWebsiteCatalog({ sku: "DEMO-SURF-001", name: "Board" }) === "demo", "demo reason");
assert(
  shouldExcludeFromWebsiteCatalog({ name: "Croissant", category: "Cafe", brand: "Dudes" }) === "food_beverage",
  "food reason"
);
assert(shouldExcludeFromWebsiteCatalog({ sku: "PUK-1", name: "Pukas", category: "SURFBOARDS", brand: "Pukas" }) === null, "live product stays");

assert(parseCatalogLimit(null) === 400, "default list cap is 400");
assert(parseCatalogLimit("8") === 8, "search can request 8");
assert(parseCatalogLimit("300") === 300, "shop can request 300");
assert(parseCatalogLimit("9999") === 500, "hard cap is 500");
assert(parseCatalogLimit("0") === 1, "limit floors at 1");
assert(parseCatalogLimit("nope") === 400, "junk falls back");

assert(MAX_PRODUCT_IMAGES === 6, "PDP galleries stay at 6 slots, not 12");

console.log("catalog hygiene ok");
