import type { StoreProduct } from "@/lib/ecommerce/catalog";
import { displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";

/** Shopify / Pukas-style sort keys. */
export const SHOP_SORT_OPTIONS = [
  "featured",
  "relevance",
  "best-selling",
  "title-ascending",
  "title-descending",
  "price-ascending",
  "price-descending",
  "created-ascending",
  "created-descending",
] as const;

export type ShopSortOption = (typeof SHOP_SORT_OPTIONS)[number];

export type ShopAvailability = "in" | "out";

export type ShopFacetFilters = {
  query: string;
  availability: ShopAvailability[];
  minPriceEuros: string;
  maxPriceEuros: string;
  productTypes: string[];
  genders: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  sort: ShopSortOption;
};

export const DEFAULT_SHOP_FACET_FILTERS: ShopFacetFilters = {
  query: "",
  availability: [],
  minPriceEuros: "",
  maxPriceEuros: "",
  productTypes: [],
  genders: [],
  brands: [],
  sizes: [],
  colors: [],
  sort: "featured",
};

function categoryParts(category: string) {
  return category
    .replace(/\uFE0F/g, "")
    .replace(/^[^A-Za-z0-9À-ÿ]+/, "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Product type facet — leaf category segment (Pukas "Garment Type" analogue). */
export function productTypeFromCategory(category: string) {
  const parts = categoryParts(category);
  if (!parts.length) return "";
  return displayOdooCategoryName(parts[parts.length - 1]!);
}

export function genderFromCategory(category: string): string | null {
  const haystack = category.toUpperCase();
  if (/\b(WOMEN|WOMAN|LADIES|FEMININO|SENHORA|MULHER)\b/.test(haystack)) return "Woman";
  if (/\b(JUNIOR|KIDS|KID|CHILD|CRIANC|CRIANÇ|YOUTH)\b/.test(haystack)) return "Junior";
  if (/\b(MEN|MAN|MASCULINO|HOMEM|MALE)\b/.test(haystack)) return "Man";
  return null;
}

export function isValidShopSort(value: string | null | undefined): value is ShopSortOption {
  return Boolean(value && (SHOP_SORT_OPTIONS as readonly string[]).includes(value));
}

export function parseListParam(value: string | null) {
  if (!value) return [] as string[];
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function parseAvailabilityParam(value: string | null): ShopAvailability[] {
  return parseListParam(value).filter((item): item is ShopAvailability => item === "in" || item === "out");
}

function eurosToCents(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export function applyShopFacetFilters(products: StoreProduct[], filters: ShopFacetFilters) {
  const query = filters.query.trim().toLowerCase();
  const minPriceCents = eurosToCents(filters.minPriceEuros);
  const maxPriceCents = eurosToCents(filters.maxPriceEuros);

  return products.filter((product) => {
    if (filters.availability.length === 1) {
      const inStock = product.stockQuantity > 0;
      if (filters.availability[0] === "in" && !inStock) return false;
      if (filters.availability[0] === "out" && inStock) return false;
    } else if (filters.availability.length > 1) {
      const inStock = product.stockQuantity > 0;
      const ok =
        (filters.availability.includes("in") && inStock) ||
        (filters.availability.includes("out") && !inStock);
      if (!ok) return false;
    }

    if (minPriceCents !== null && product.priceCents < minPriceCents) return false;
    if (maxPriceCents !== null && product.priceCents > maxPriceCents) return false;

    if (filters.productTypes.length) {
      const type = productTypeFromCategory(product.category);
      if (!filters.productTypes.includes(type)) return false;
    }

    if (filters.genders.length) {
      const gender = genderFromCategory(product.category);
      if (!gender || !filters.genders.includes(gender)) return false;
    }

    if (filters.brands.length && !filters.brands.includes(product.brand)) return false;
    if (filters.sizes.length && (!product.size || !filters.sizes.includes(product.size))) return false;
    if (filters.colors.length && (!product.color || !filters.colors.includes(product.color))) return false;

    if (!query) return true;
    return [
      product.name,
      product.description,
      product.category,
      product.brand,
      product.sku,
      product.refId,
      product.size,
      product.color,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

function relevanceScore(product: StoreProduct, query: string) {
  if (!query) return 0;
  const name = product.name.toLowerCase();
  if (name === query) return 300;
  if (name.startsWith(query)) return 200;
  if (name.includes(query)) return 100;
  return 10;
}

export function sortShopProducts(products: StoreProduct[], sort: ShopSortOption, query = "") {
  const list = [...products];
  const q = query.trim().toLowerCase();

  list.sort((a, b) => {
    switch (sort) {
      case "title-ascending":
        return a.name.localeCompare(b.name);
      case "title-descending":
        return b.name.localeCompare(a.name);
      case "price-ascending":
        return a.priceCents - b.priceCents || a.name.localeCompare(b.name);
      case "price-descending":
        return b.priceCents - a.priceCents || a.name.localeCompare(b.name);
      case "created-ascending": {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return aTime - bTime || a.name.localeCompare(b.name);
      }
      case "created-descending": {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bTime - aTime || a.name.localeCompare(b.name);
      }
      case "best-selling": {
        const aScore =
          (a.isOpportunity ? 50 : 0) +
          (a.opportunityDiscountPercent || 0) +
          (a.availableForSale ? 10 : 0);
        const bScore =
          (b.isOpportunity ? 50 : 0) +
          (b.opportunityDiscountPercent || 0) +
          (b.availableForSale ? 10 : 0);
        return bScore - aScore || a.name.localeCompare(b.name);
      }
      case "relevance": {
        const aScore = relevanceScore(a, q) + (a.availableForSale ? 5 : 0);
        const bScore = relevanceScore(b, q) + (b.availableForSale ? 5 : 0);
        return bScore - aScore || a.name.localeCompare(b.name);
      }
      case "featured":
      default: {
        const aScore =
          (a.isOpportunity ? 40 : 0) +
          (a.availableForSale ? 20 : 0) +
          (a.stockQuantity > 0 ? 10 : 0);
        const bScore =
          (b.isOpportunity ? 40 : 0) +
          (b.availableForSale ? 20 : 0) +
          (b.stockQuantity > 0 ? 10 : 0);
        return bScore - aScore || a.name.localeCompare(b.name);
      }
    }
  });

  return list;
}

export type FacetBucket = { value: string; count: number };

function countFacet(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

export function buildShopFacets(products: StoreProduct[]) {
  return {
    brands: countFacet(products.map((product) => product.brand)),
    sizes: countFacet(products.map((product) => product.size)),
    colors: countFacet(products.map((product) => product.color)),
    productTypes: countFacet(products.map((product) => productTypeFromCategory(product.category))),
    genders: countFacet(products.map((product) => genderFromCategory(product.category))),
    availability: {
      in: products.filter((product) => product.stockQuantity > 0).length,
      out: products.filter((product) => product.stockQuantity <= 0).length,
    },
    priceBounds: products.reduce(
      (bounds, product) => ({
        min: Math.min(bounds.min, product.priceCents),
        max: Math.max(bounds.max, product.priceCents),
      }),
      { min: Number.POSITIVE_INFINITY, max: 0 }
    ),
  };
}

export function toggleListValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
