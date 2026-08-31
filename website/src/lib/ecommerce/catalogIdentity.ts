/** Shared catalog hygiene — used by listings, sitemap, and Odoo sync. */

export function isMockProductIdentity(product: {
  id?: string | null;
  slug?: string | null;
  sku?: string | null;
  refId?: string | null;
}) {
  const id = String(product.id || "");
  const slug = String(product.slug || "");
  const sku = String(product.sku || product.refId || "");
  return id.startsWith("mock-") || slug.includes("-demo") || sku.toUpperCase().startsWith("DEMO-");
}

/** Cafe / food SKUs stay in Odoo but must not appear on the storefront. */
export function isFoodBeverageCatalogRow(product: {
  name?: string | null;
  category?: string | null;
  brand?: string | null;
}) {
  const haystack = `${product.name || ""} ${product.category || ""} ${product.brand || ""}`.toLowerCase();
  const blockedTerms = [
    "dudes",
    "cafe",
    "café",
    "coffee",
    "cerveja",
    "beer",
    "food",
    "bebida",
    "beverage",
    "snack",
    "pastel",
    "bolo",
    "cake",
    "menu",
    "croissant",
    "tosta",
    "sandwich",
    "sandes",
    "sumo",
    "juice",
    "wine",
    "vinho",
    "down payment",
  ];
  if (blockedTerms.some((term) => haystack.includes(term))) return true;
  const standaloneName = String(product.name || "")
    .trim()
    .toLowerCase();
  return (
    standaloneName === "expresso" ||
    standaloneName === "espresso" ||
    standaloneName === "cappuccino" ||
    standaloneName === "capuccino" ||
    standaloneName === "chá" ||
    standaloneName === "cha" ||
    standaloneName === "banana bread" ||
    standaloneName === "flat white"
  );
}

export function shouldExcludeFromWebsiteCatalog(product: {
  id?: string | null;
  slug?: string | null;
  sku?: string | null;
  refId?: string | null;
  name?: string | null;
  category?: string | null;
  brand?: string | null;
}) {
  if (isMockProductIdentity(product)) return "demo";
  if (isFoodBeverageCatalogRow(product)) return "food_beverage";
  return null;
}

export function parseCatalogLimit(value: string | null | undefined, fallback = 400) {
  if (value == null || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(500, Math.max(1, parsed));
}
