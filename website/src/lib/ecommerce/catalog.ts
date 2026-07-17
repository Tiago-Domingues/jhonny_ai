import "server-only";

import { Product } from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import { eurosToCents } from "@/lib/ecommerce/money";
import { fetchOdooProducts, syncOdooProducts } from "@/lib/ecommerce/odooCatalog";
import { hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { productMatchesCategoryGroup, productMatchesSubcategory } from "@/lib/ecommerce/categoryGroups";

type OdooProduct = Awaited<ReturnType<typeof fetchOdooProducts>>["products"][number];

export type StoreProduct = {
  id: string;
  slug: string;
  sku?: string | null;
  barcode?: string | null;
  refId?: string | null;
  name: string;
  description: string;
  category: string;
  brand: string;
  size?: string | null;
  color?: string | null;
  imageUrl: string;
  imageUrls?: string[];
  marketingDescription?: string | null;
  videoUrl?: string | null;
  contentSourceName?: string | null;
  contentSourceUrl?: string | null;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  forecastQuantity?: number;
  stockState?: string;
  saleable?: boolean;
  availableForSale?: boolean;
  isOpportunity?: boolean;
  opportunityOriginalPriceCents?: number | null;
  opportunityDiscountPercent?: number | null;
  opportunitySource?: string | null;
  odooProductId?: number | null;
  odooProductTemplateId?: number | null;
  createdAt?: string | null;
};

export type ProductFilters = {
  query?: string | null;
  category?: string | null;
  categoryGroup?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  size?: string | null;
  color?: string | null;
  inStockOnly?: boolean;
  minPriceCents?: number | null;
  maxPriceCents?: number | null;
};

export const mockProducts: StoreProduct[] = [
  {
    id: "mock-surfboard-performance",
    slug: "performance-surfboard-demo",
    sku: "DEMO-SURF-001",
    refId: "DEMO-SURF-001",
    name: "Performance Surfboard Demo",
    description: "Demo product until the Odoo catalog is connected.",
    category: "surfboards",
    brand: "Jhonny Surf Store",
    imageUrl: "/brand/categories/cat-surfboards.svg",
    priceCents: eurosToCents(499),
    currency: "EUR",
    stockQuantity: 3,
    forecastQuantity: 3,
    stockState: "in_stock",
    saleable: true,
    availableForSale: true,
    isOpportunity: false,
  },
  {
    id: "mock-wetsuit-43",
    slug: "wetsuit-43-demo",
    sku: "DEMO-WET-43",
    refId: "DEMO-WET-43",
    name: "4/3 Wetsuit Demo",
    description: "Warm all-season wetsuit placeholder for checkout testing.",
    category: "wetsuits",
    brand: "Jhonny Surf Store",
    imageUrl: "/brand/categories/cat-wetsuits.svg",
    priceCents: eurosToCents(219),
    currency: "EUR",
    stockQuantity: 8,
    size: "M",
    color: "Black",
    forecastQuantity: 8,
    stockState: "in_stock",
    saleable: true,
    availableForSale: true,
    isOpportunity: false,
  },
  {
    id: "mock-jss-tee",
    slug: "jss-tee-demo",
    sku: "DEMO-JSS-TEE",
    refId: "DEMO-JSS-TEE",
    name: "JSS Tee Demo",
    description: "Local JSS apparel placeholder before Odoo products sync.",
    category: "jss",
    brand: "JSS",
    imageUrl: "/brand/categories/cat-lifestyle.svg",
    priceCents: eurosToCents(29),
    currency: "EUR",
    stockQuantity: 20,
    size: "L",
    color: "White",
    forecastQuantity: 20,
    stockState: "in_stock",
    saleable: true,
    availableForSale: true,
    isOpportunity: false,
  },
];

/** List/detail payloads never need base64 blobs from imageUrlsJson — images are served via /api/products/images. */
const productListSelect = {
  id: true,
  slug: true,
  sku: true,
  barcode: true,
  refId: true,
  name: true,
  description: true,
  category: true,
  brand: true,
  size: true,
  color: true,
  imageUrl: true,
  marketingDescription: true,
  videoUrl: true,
  contentSourceName: true,
  contentSourceUrl: true,
  priceCents: true,
  currency: true,
  stockQuantity: true,
  forecastQuantity: true,
  stockState: true,
  saleable: true,
  availableForSale: true,
  isOpportunity: true,
  opportunityOriginalPriceCents: true,
  opportunityDiscountPercent: true,
  opportunitySource: true,
  odooProductId: true,
  odooProductTemplateId: true,
  createdAt: true,
} as const;

type ListedProduct = {
  id: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  refId: string | null;
  name: string;
  description: string | null;
  category: string;
  brand: string | null;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
  marketingDescription: string | null;
  videoUrl: string | null;
  contentSourceName: string | null;
  contentSourceUrl: string | null;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  forecastQuantity: number | null;
  stockState: string | null;
  saleable: boolean;
  availableForSale: boolean;
  isOpportunity: boolean;
  opportunityOriginalPriceCents: number | null;
  opportunityDiscountPercent: number | null;
  opportunitySource: string | null;
  odooProductId: number | null;
  odooProductTemplateId: number | null;
  createdAt?: Date | string | null;
};

function toStoreProduct(product: ListedProduct | Product): StoreProduct {
  const createdAt =
    "createdAt" in product && product.createdAt
      ? product.createdAt instanceof Date
        ? product.createdAt.toISOString()
        : String(product.createdAt)
      : null;

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    barcode: product.barcode,
    refId: product.refId,
    name: product.name,
    description: product.description || "",
    category: product.category,
    brand: product.brand || "",
    size: product.size,
    color: product.color,
    imageUrl: product.imageUrl || "/brand/logo-stacked.svg",
    // Keep list responses lean; detail pages can still hydrate media separately.
    imageUrls: undefined,
    marketingDescription: product.marketingDescription,
    videoUrl: product.videoUrl,
    contentSourceName: product.contentSourceName,
    contentSourceUrl: product.contentSourceUrl,
    priceCents: product.priceCents,
    currency: product.currency,
    stockQuantity: product.stockQuantity,
    forecastQuantity: product.forecastQuantity ?? undefined,
    stockState: product.stockState ?? undefined,
    saleable: product.saleable,
    availableForSale: product.availableForSale,
    isOpportunity: product.isOpportunity,
    opportunityOriginalPriceCents: product.opportunityOriginalPriceCents,
    opportunityDiscountPercent: product.opportunityDiscountPercent,
    opportunitySource: product.opportunitySource,
    odooProductId: product.odooProductId,
    odooProductTemplateId: product.odooProductTemplateId,
    createdAt,
  };
}

let odooSyncInFlight: Promise<unknown> | null = null;

function kickBackgroundOdooSync() {
  if (odooSyncInFlight) return;
  odooSyncInFlight = syncOdooProducts()
    .catch(() => undefined)
    .finally(() => {
      odooSyncInFlight = null;
    });
}

function toStoreProductFromOdoo(product: OdooProduct): StoreProduct {
  const mapped = toStoreProduct(product as unknown as Product);
  mapped.id = `odoo-${product.odooProductId}`;
  mapped.imageUrls = undefined;
  return mapped;
}

async function listLiveOdooProducts(filters: ProductFilters = {}) {
  if (process.env.ODOO_LIVE_CATALOG !== "true" || !hasOdooConfig()) return null;

  const result = await fetchOdooProducts();
  if (!result.configured) return null;

  const products = result.products
    .filter((product) => !product.excludedFromCatalog)
    .map(toStoreProductFromOdoo);

  return dedupeStoreProducts(products.filter((product) => matchesFilters(product, filters)));
}

function matchesFilters(product: StoreProduct, filters: ProductFilters = {}) {
  const query = filters.query?.trim().toLowerCase();
  if (query) {
    const haystack = [
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
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (filters.category && product.category !== filters.category) return false;
  if (!productMatchesCategoryGroup(product.category, filters.categoryGroup)) return false;
  if (!productMatchesSubcategory(product.category, filters.subcategory)) return false;
  if (filters.brand && product.brand !== filters.brand) return false;
  if (filters.size && product.size !== filters.size) return false;
  if (filters.color && product.color !== filters.color) return false;
  if (filters.inStockOnly && product.stockQuantity <= 0) return false;
  if (filters.minPriceCents !== undefined && filters.minPriceCents !== null && product.priceCents < filters.minPriceCents) return false;
  if (filters.maxPriceCents !== undefined && filters.maxPriceCents !== null && product.priceCents > filters.maxPriceCents) return false;
  return true;
}

function normalizedDedupePart(value?: string | number | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function productDedupeKey(product: StoreProduct) {
  const productIdentity =
    normalizedDedupePart(product.sku) ||
    normalizedDedupePart(product.barcode) ||
    normalizedDedupePart(product.refId);
  const variantIdentity = productIdentity || [
    normalizedDedupePart(product.size),
    normalizedDedupePart(product.color),
  ].join("|");
  const templateIdentity = product.odooProductTemplateId
    ? `template:${product.odooProductTemplateId}`
    : `name:${normalizedDedupePart(product.name)}`;

  return [
    templateIdentity,
    normalizedDedupePart(product.category),
    normalizedDedupePart(product.brand),
    variantIdentity || "default-variant",
  ].join("::");
}

function productDisplayScore(product: StoreProduct) {
  const hasStock = product.stockQuantity > 0 || (product.forecastQuantity ?? 0) > 0;
  const hasImage =
    Boolean(product.imageUrl && !product.imageUrl.includes("logo-stacked")) ||
    Boolean(product.imageUrls?.length);
  const isSaleable = product.saleable !== false && product.availableForSale !== false;

  return (hasStock ? 100 : 0) + (hasImage ? 10 : 0) + (isSaleable ? 1 : 0);
}

function dedupeStoreProducts(products: StoreProduct[]) {
  const byKey = new Map<string, StoreProduct>();

  for (const product of products) {
    const key = productDedupeKey(product);
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, product);
      continue;
    }

    const productScore = productDisplayScore(product);
    const currentScore = productDisplayScore(current);
    const productOdooId = product.odooProductId ?? Number.MAX_SAFE_INTEGER;
    const currentOdooId = current.odooProductId ?? Number.MAX_SAFE_INTEGER;

    if (productScore > currentScore || (productScore === currentScore && productOdooId < currentOdooId)) {
      byKey.set(key, product);
    }
  }

  return Array.from(byKey.values());
}

export async function listProducts(filters: ProductFilters = {}): Promise<StoreProduct[]> {
  if (!hasDatabaseUrl()) {
    try {
      const liveProducts = await listLiveOdooProducts(filters);
      if (liveProducts?.length) return liveProducts;
    } catch {
      // Fall through to mock products if Odoo is temporarily unavailable.
    }
    return mockProducts;
  }

  try {
    if (process.env.ODOO_LIVE_CATALOG === "true" && hasOdooConfig()) {
      const newest = await prisma.product.findFirst({
        where: { odooSyncStatus: "SYNCED" },
        orderBy: { lastOdooSyncAt: "desc" },
        select: { lastOdooSyncAt: true },
      });
      const stale =
        !newest?.lastOdooSyncAt || Date.now() - newest.lastOdooSyncAt.getTime() > 15 * 60 * 1000;
      // Never block product listing on a full Odoo sync — refresh in the background.
      if (stale) kickBackgroundOdooSync();
    }

    const products = await prisma.product.findMany({
      where: { active: true, excludedFromCatalog: false },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: productListSelect,
    });
    const mapped = products.length ? products.map(toStoreProduct) : mockProducts;
    return dedupeStoreProducts(mapped.filter((product) => matchesFilters(product, filters)));
  } catch {
    try {
      const liveProducts = await listLiveOdooProducts(filters);
      if (liveProducts?.length) return liveProducts;
    } catch {
      // Fall through to mock products if both DB and Odoo fail.
    }
    return dedupeStoreProducts(mockProducts.filter((product) => matchesFilters(product, filters)));
  }
}

export async function listOpportunityProducts(limit = 16): Promise<StoreProduct[]> {
  if (!hasDatabaseUrl()) {
    try {
      const liveProducts = await listLiveOdooProducts();
      return (liveProducts || [])
        .filter((product) => product.isOpportunity)
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        excludedFromCatalog: false,
        isOpportunity: true,
      },
      orderBy: [{ opportunityDiscountPercent: "desc" }, { name: "asc" }],
      take: limit * 3,
      select: productListSelect,
    });
    return dedupeStoreProducts(products.map(toStoreProduct)).slice(0, limit);
  } catch {
    return [];
  }
}

/** Match Odoo category paths like "New Arrivals", "Novidades", etc. */
export function isNewArrivalsCategory(category: string) {
  const normalized = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return (
    normalized.includes("NEW ARRIVAL") ||
    normalized.includes("NEWARRIVAL") ||
    normalized.includes("NOVIDADE") ||
    normalized.includes("NOVOS PRODUTOS") ||
    normalized.includes("NEW IN")
  );
}

/**
 * Products from the Odoo "New Arrivals" category.
 * Until that category exists / is synced, falls back to opportunity products as placeholders.
 */
export async function listNewArrivalProducts(limit = 16): Promise<StoreProduct[]> {
  const fromLiveOrDb = async (): Promise<StoreProduct[]> => {
    if (!hasDatabaseUrl()) {
      const liveProducts = await listLiveOdooProducts();
      return (liveProducts || [])
        .filter((product) => isNewArrivalsCategory(product.category))
        .slice(0, limit);
    }

    const products = await prisma.product.findMany({
      where: {
        active: true,
        excludedFromCatalog: false,
      },
      orderBy: [{ lastOdooSyncAt: "desc" }, { name: "asc" }],
      take: 400,
      select: productListSelect,
    });
    return dedupeStoreProducts(
      products.map(toStoreProduct).filter((product) => isNewArrivalsCategory(product.category))
    ).slice(0, limit);
  };

  try {
    const arrivals = await fromLiveOrDb();
    if (arrivals.length) return arrivals;
  } catch {
    // Fall through to opportunity placeholders.
  }

  // Placeholder until the Odoo "New Arrivals" category is created and synced.
  return listOpportunityProducts(limit);
}

export async function getProduct(productId: string): Promise<StoreProduct | null> {
  const mock = mockProducts.find((product) => product.id === productId || product.slug === productId);
  if (!hasDatabaseUrl()) {
    try {
      const liveProducts = await listLiveOdooProducts();
      const liveProduct = liveProducts?.find((product) => product.id === productId || product.slug === productId);
      return liveProduct || mock || null;
    } catch {
      return mock || null;
    }
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { slug: productId }],
        active: true,
        excludedFromCatalog: false,
      },
    });
    return product ? toStoreProduct(product) : mock || null;
  } catch {
    return mock || null;
  }
}

export async function ensureProduct(productId: string) {
  const product = await getProduct(productId);
  if (!product) return null;
  if (!hasDatabaseUrl()) return null;

  return prisma.product.upsert({
    where: { slug: product.slug },
    update: {
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      imageUrl: product.imageUrl,
      imageUrlsJson: JSON.stringify(product.imageUrls || [product.imageUrl]),
      priceCents: product.priceCents,
      currency: product.currency,
      stockQuantity: product.stockQuantity,
      forecastQuantity: product.forecastQuantity || product.stockQuantity,
      stockState: product.stockState || (product.stockQuantity > 0 ? "in_stock" : "out_of_stock"),
      saleable: product.saleable ?? true,
      availableForSale: product.availableForSale ?? product.stockQuantity > 0,
      isOpportunity: product.isOpportunity ?? false,
      opportunityOriginalPriceCents: product.opportunityOriginalPriceCents,
      opportunityDiscountPercent: product.opportunityDiscountPercent,
      opportunitySource: product.opportunitySource,
    },
    create: {
      slug: product.slug,
      sku: product.sku,
      barcode: product.barcode,
      refId: product.refId,
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      size: product.size,
      color: product.color,
      imageUrl: product.imageUrl,
      imageUrlsJson: JSON.stringify(product.imageUrls || [product.imageUrl]),
      priceCents: product.priceCents,
      currency: product.currency,
      stockQuantity: product.stockQuantity,
      forecastQuantity: product.forecastQuantity || product.stockQuantity,
      stockState: product.stockState || (product.stockQuantity > 0 ? "in_stock" : "out_of_stock"),
      saleable: product.saleable ?? true,
      availableForSale: product.availableForSale ?? product.stockQuantity > 0,
      isOpportunity: product.isOpportunity ?? false,
      opportunityOriginalPriceCents: product.opportunityOriginalPriceCents,
      opportunityDiscountPercent: product.opportunityDiscountPercent,
      opportunitySource: product.opportunitySource,
    },
  });
}
