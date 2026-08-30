import type { StoreProduct } from "@/lib/ecommerce/catalog";
import type { Locale } from "@/lib/i18n";

export type VariantAttributeMap = Record<string, string>;

export type StoreProductListing = StoreProduct & {
  variantCount?: number;
  hasVariants?: boolean;
  variantSizes?: string[];
  variantColors?: string[];
  variantAttributeOptions?: Record<string, string[]>;
  minPriceCents?: number;
  maxPriceCents?: number;
};

const INTERNAL_ATTRIBUTE_PATTERN =
  /oportunidade|new\s*in|newin|new\s*arrival|novidade|internal/i;

export function parseVariantAttributesJson(raw?: string | null): VariantAttributeMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        ([key, value]) => Boolean(key) && typeof value === "string" && value.trim()
      )
    ) as VariantAttributeMap;
  } catch {
    return {};
  }
}

export function canonicalVariantAxisKey(key: string) {
  const normalized = key.toLowerCase();
  if (/cor|colour|color/.test(normalized)) return "Color";
  if (/size|tamanho|\btam\b/.test(normalized)) return "Size";
  return key;
}

export function variantAttributesForProduct(product: StoreProduct): VariantAttributeMap {
  const fromJson = parseVariantAttributesJson(product.variantAttributesJson);
  const source = Object.keys(fromJson).length
    ? fromJson
    : {
        ...(product.size ? { Size: product.size } : {}),
        ...(product.color ? { Color: product.color } : {}),
      };
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [canonicalVariantAxisKey(key), value])
  ) as VariantAttributeMap;
}

function normalizePart(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function templateGroupKey(product: StoreProduct) {
  if (product.odooProductTemplateId) return `tmpl:${product.odooProductTemplateId}`;
  const ref = normalizePart(product.refId || product.sku);
  if (ref) return `ref:${ref}::${normalizePart(product.category)}::${normalizePart(product.brand)}`;
  return `single:${product.id}`;
}

function productDisplayScore(product: StoreProduct) {
  const hasStock = product.stockQuantity > 0 || (product.forecastQuantity ?? 0) > 0;
  const hasImage =
    Boolean(product.imageUrl && !product.imageUrl.includes("logo-stacked")) ||
    Boolean(product.imageUrls?.length);
  const isSaleable = product.saleable !== false && product.availableForSale !== false;

  return (hasStock ? 100 : 0) + (hasImage ? 10 : 0) + (isSaleable ? 1 : 0);
}

export function pickRepresentativeVariant(variants: StoreProduct[]) {
  return [...variants].sort((a, b) => {
    const scoreDiff = productDisplayScore(b) - productDisplayScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    const priceDiff = a.priceCents - b.priceCents;
    if (priceDiff !== 0) return priceDiff;
    return (a.odooProductId ?? Number.MAX_SAFE_INTEGER) - (b.odooProductId ?? Number.MAX_SAFE_INTEGER);
  })[0]!;
}

/**
 * Drop leftover empty wrappers and trailing punctuation after variant
 * attributes (color/size) are removed from an Odoo title.
 * Keeps meaningful tails such as "(Kids)", "8'2", or "Vol. 2".
 */
export function cleanProductDisplayName(name: string) {
  let title = String(name || "").replace(/\s+/g, " ").trim();
  let previous = "";
  while (title && title !== previous) {
    previous = title;
    title = title
      .replace(/\(\s*\)/g, " ")
      .replace(/\[\s*\]/g, " ")
      .replace(/\{\s*\}/g, " ")
      .replace(/（\s*）/g, " ")
      .replace(/【\s*】/g, " ")
      .replace(/[/|\\]+\s*$/g, "")
      .replace(/[-–—,;:·•*]+\s*$/g, "")
      .replace(/\.+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  return title;
}

function stripKnownAttributeValues(name: string, variants: StoreProduct[]) {
  let title = name.trim();
  for (const variant of variants) {
    for (const value of Object.values(variantAttributesForProduct(variant))) {
      const trimmed = value.trim();
      if (trimmed.length < 2) continue;
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      title = title.replace(new RegExp(`\\(\\s*${escaped}\\s*\\)`, "ig"), " ");
      title = title.replace(new RegExp(`\\[\\s*${escaped}\\s*\\]`, "ig"), " ");
      title = title.replace(new RegExp(`([(/|,]|[-–—])\\s*${escaped}\\b`, "ig"), "$1");
      title = title.replace(new RegExp(`\\b${escaped}\\s*([)/|,]|[-–—])`, "ig"), "$1");
      title = title.replace(new RegExp(`\\b${escaped}\\b`, "ig"), " ");
    }
  }
  return cleanProductDisplayName(title);
}

export function deriveTemplateDisplayName(variants: StoreProduct[]) {
  if (!variants.length) return "";
  if (variants.length === 1) return cleanProductDisplayName(variants[0]!.name);

  const sharedRef = variants.every(
    (variant) => normalizePart(variant.refId || variant.sku) === normalizePart(variants[0]!.refId || variants[0]!.sku)
  );
  if (sharedRef && variants[0]!.refId) {
    const stripped = stripKnownAttributeValues(variants[0]!.name, variants);
    if (stripped.length >= 3) return stripped;
  }

  const strippedNames = variants
    .map((variant) => stripKnownAttributeValues(variant.name, variants))
    .filter((name) => name.length >= 3);
  if (strippedNames.length) {
    const first = strippedNames[0]!;
    if (strippedNames.every((name) => name === first)) return first;
  }

  const names = variants.map((variant) => variant.name.trim()).filter(Boolean);
  if (!names.length) return cleanProductDisplayName(variants[0]!.name);

  let prefix = names[0]!;
  for (const name of names.slice(1)) {
    while (prefix && !name.toLowerCase().startsWith(prefix.toLowerCase())) {
      prefix = prefix.slice(0, -1).trim();
    }
  }
  prefix = cleanProductDisplayName(prefix);
  return prefix.length >= 3 ? prefix : cleanProductDisplayName(pickRepresentativeVariant(variants).name);
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function collectVariantAttributeOptions(variants: StoreProduct[]) {
  const options: Record<string, Set<string>> = {};
  for (const variant of variants) {
    for (const [key, value] of Object.entries(variantAttributesForProduct(variant))) {
      if (INTERNAL_ATTRIBUTE_PATTERN.test(key)) continue;
      if (!options[key]) options[key] = new Set<string>();
      options[key].add(value);
    }
  }
  return Object.fromEntries(
    Object.entries(options)
      .map(([key, values]) => [key, Array.from(values).sort((a, b) => a.localeCompare(b))])
      .filter(([, values]) => values.length > 0)
  );
}

export function buildTemplateListingProduct(variants: StoreProduct[]): StoreProductListing {
  const representative = pickRepresentativeVariant(variants);
  const prices = variants.map((variant) => variant.priceCents);
  const minPriceCents = Math.min(...prices);
  const maxPriceCents = Math.max(...prices);
  const totalStock = variants.reduce((sum, variant) => sum + Math.max(0, variant.stockQuantity), 0);
  const totalForecast = variants.reduce(
    (sum, variant) => sum + Math.max(0, variant.forecastQuantity ?? variant.stockQuantity),
    0
  );
  const availableForSale = variants.some(
    (variant) => variant.availableForSale !== false && variant.stockQuantity > 0
  );
  const attributeOptions = collectVariantAttributeOptions(variants);

  return {
    ...representative,
    name: deriveTemplateDisplayName(variants),
    slug: representative.slug,
    priceCents: minPriceCents,
    minPriceCents,
    maxPriceCents,
    stockQuantity: totalStock,
    forecastQuantity: totalForecast,
    availableForSale,
    saleable: variants.some((variant) => variant.saleable !== false),
    stockState: availableForSale ? representative.stockState || "in_stock" : "out_of_stock",
    size: null,
    color: null,
    isOpportunity: variants.some((variant) => variant.isOpportunity),
    isNewIn: variants.some((variant) => variant.isNewIn),
    opportunityOriginalPriceCents: representative.opportunityOriginalPriceCents,
    opportunityDiscountPercent: representative.opportunityDiscountPercent,
    variantCount: variants.length,
    hasVariants: true,
    variantSizes: uniqueSorted(variants.map((variant) => variant.size)),
    variantColors: uniqueSorted(variants.map((variant) => variant.color)),
    variantAttributeOptions: attributeOptions,
  };
}

/** Collapse Odoo template variants into one shop listing per parent product. */
export function groupStoreProductsForListing(products: StoreProduct[]): StoreProductListing[] {
  const singles: StoreProduct[] = [];
  const groups = new Map<string, StoreProduct[]>();

  for (const product of products) {
    const key = templateGroupKey(product);
    if (key.startsWith("single:")) {
      singles.push(product);
      continue;
    }
    const bucket = groups.get(key) || [];
    bucket.push(product);
    groups.set(key, bucket);
  }

  const grouped: StoreProductListing[] = singles.map((product) => ({
    ...product,
    name: cleanProductDisplayName(product.name),
    variantCount: 1,
    hasVariants: false,
  }));

  for (const variants of groups.values()) {
    if (variants.length <= 1) {
      grouped.push({
        ...variants[0]!,
        name: cleanProductDisplayName(variants[0]!.name),
        variantCount: 1,
        hasVariants: false,
      });
      continue;
    }
    grouped.push(buildTemplateListingProduct(variants));
  }

  return grouped;
}

export type VariantAxis = {
  key: string;
  label: string;
  values: string[];
};

export function localizeVariantAxisLabel(key: string, locale: Locale): string {
  const normalized = key.toLowerCase();
  const isColor = /cor|colour|color/.test(normalized);
  const isSize = /size|tamanho|\btam\b/.test(normalized);
  if (isColor) {
    if (locale === "pt") return "Cor";
    if (locale === "zh") return "颜色";
    return "Color";
  }
  if (isSize) {
    if (locale === "pt") return "Tamanho";
    if (locale === "zh") return "尺码";
    return "Size";
  }
  return key;
}

export function buildVariantAxes(variants: StoreProduct[]): VariantAxis[] {
  const options = collectVariantAttributeOptions(variants);
  const preferredOrder = ["Color", "Cor", "Colour", "Size", "Tamanho"];
  const keys = Object.keys(options).sort((a, b) => {
    const aIndex = preferredOrder.findIndex((label) => a.toLowerCase().includes(label.toLowerCase()));
    const bIndex = preferredOrder.findIndex((label) => b.toLowerCase().includes(label.toLowerCase()));
    const safeA = aIndex === -1 ? preferredOrder.length : aIndex;
    const safeB = bIndex === -1 ? preferredOrder.length : bIndex;
    if (safeA !== safeB) return safeA - safeB;
    return a.localeCompare(b);
  });

  return keys.map((key) => ({
    key,
    label: key,
    values: options[key] || [],
  }));
}

export function findVariantByAttributes(
  variants: StoreProduct[],
  selection: VariantAttributeMap
) {
  const entries = Object.entries(selection).filter(([, value]) => value);
  if (!entries.length) return pickRepresentativeVariant(variants);

  return (
    variants.find((variant) => {
      const attrs = variantAttributesForProduct(variant);
      return entries.every(([key, value]) => attrs[key] === value);
    }) || pickRepresentativeVariant(variants)
  );
}

export function listingMatchesSizeFilter(product: StoreProductListing, sizes: string[]) {
  if (!sizes.length) return true;
  const values = product.variantSizes?.length
    ? product.variantSizes
    : product.size
      ? [product.size]
      : [];
  return sizes.some((size) => values.includes(size));
}

export function listingMatchesColorFilter(product: StoreProductListing, colors: string[]) {
  if (!colors.length) return true;
  const values = product.variantColors?.length
    ? product.variantColors
    : product.color
      ? [product.color]
      : [];
  return colors.some((color) => values.includes(color));
}
