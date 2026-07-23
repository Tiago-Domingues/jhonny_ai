import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { OdooClient, hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { buildSurfboardEnrichment } from "@/lib/ecommerce/surfboardEnrichment";

const brandFieldCandidates = [
  "x_studio_marcas",
  "product_brand_id",
  "x_marcas",
  "brand_id",
  "x_brand_id",
];

const originalPriceFieldCandidates = [
  "x_studio_preco_original",
  "x_studio_original_price",
  "x_studio_compare_at_price",
  "x_compare_at_price",
  "compare_at_price",
  "public_categ_price",
];

const discountPercentFieldCandidates = [
  "x_studio_discount_percent",
  "x_studio_discount",
  "x_discount_percent",
  "discount_percent",
];

const productFields = [
  "id",
  "name",
  "display_name",
  "default_code",
  "barcode",
  "list_price",
  "categ_id",
  "product_tmpl_id",
  "qty_available",
  "virtual_available",
  "sale_ok",
  "active",
  "description_sale",
  "description",
  "product_template_attribute_value_ids",
];

/** Prefer explicit Studio / custom fields that mirror Odoo’s “Artigo” column. */
const artigoFieldCandidates = [
  "x_studio_artigo",
  "x_artigo",
  "x_studio_nome_do_artigo",
  "x_studio_nome_artigo",
  "x_nome_artigo",
];

const imagePresenceFieldCandidates = ["image_128", "image_256", "image_512"];

const fieldsGetCache = new Map<string, { at: number; fields: Record<string, unknown> }>();
const FIELDS_GET_TTL_MS = 30 * 60 * 1000;

async function getModelFields(client: OdooClient, model: string) {
  const cached = fieldsGetCache.get(model);
  if (cached && Date.now() - cached.at < FIELDS_GET_TTL_MS) {
    return cached.fields;
  }

  const fields = (await client.executeKw(model, "fields_get", [], {
    attributes: ["string", "type"],
  })) as Record<string, unknown>;
  fieldsGetCache.set(model, { at: Date.now(), fields });
  return fields;
}

type OdooRow = Record<string, unknown>;

type SyncedOdooProduct = {
  odooProductId: number;
  odooProductTemplateId: number | null;
  slug: string;
  sku: string | null;
  barcode: string | null;
  refId: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  size: string | null;
  color: string | null;
  imageUrl: string;
  imageUrlsJson: string;
  marketingDescription: string | null;
  videoUrl: string | null;
  contentSourceName: string | null;
  contentSourceUrl: string | null;
  contentUpdatedAt: Date | null;
  contentSyncStatus: string | null;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  forecastQuantity: number;
  stockState: string;
  saleable: boolean;
  availableForSale: boolean;
  active: boolean;
  excludedFromCatalog: boolean;
  exclusionReason: string | null;
  isOpportunity: boolean;
  isNewIn: boolean;
  opportunityOriginalPriceCents: number | null;
  opportunityDiscountPercent: number | null;
  opportunitySource: string | null;
  odooSyncStatus: "SYNCED";
  odooSyncError: null;
  lastOdooSyncAt: Date;
};

function many2oneName(value: unknown, fallback = "") {
  return Array.isArray(value) && value.length > 1 ? String(value[1] || fallback) : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function cents(value: unknown) {
  return Math.round(Number(value || 0) * 100);
}

function stockState(quantity: number, saleable: boolean) {
  if (!saleable) return "not_saleable";
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= 2) return "low_stock";
  return "in_stock";
}

function foodBeverageExclusion(product: { name: string; category: string; brand: string }) {
  const haystack = `${product.name} ${product.category} ${product.brand}`.toLowerCase();
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
  ];
  return blockedTerms.some((term) => haystack.includes(term));
}

async function availableField(client: OdooClient, model: string, candidates: string[]) {
  try {
    const fields = await getModelFields(client, model);
    return candidates.find((candidate) => candidate in fields) || null;
  } catch {
    return null;
  }
}

async function availableFields(client: OdooClient, model: string, candidates: string[]) {
  try {
    const fields = await getModelFields(client, model);
    return candidates.filter((candidate) => candidate in fields);
  } catch {
    return [];
  }
}

/**
 * Resolve the commercial product title as shown in Odoo (“Artigo”).
 * Prefer a custom/Studio Artigo field when present; otherwise use display_name
 * (includes variant attrs / default_code formatting), then raw name.
 */
async function resolveArtigoFieldName(client: OdooClient) {
  const known = await availableField(client, "product.product", artigoFieldCandidates);
  if (known) return known;

  try {
    const fields = await getModelFields(client, "product.product");
    for (const [name, meta] of Object.entries(fields)) {
      if (!meta || typeof meta !== "object") continue;
      const info = meta as { string?: string; type?: string };
      if (info.type && !["char", "text"].includes(info.type)) continue;
      const label = String(info.string || "").trim().toLowerCase();
      if (!label) continue;
      if (label === "artigo" || label === "nome do artigo" || label === "nome artigo") {
        return name;
      }
    }
  } catch {
    // fall through
  }
  return null;
}

function resolveOdooArtigoName(product: OdooRow, artigoField: string | null) {
  const sku = product.default_code ? String(product.default_code).trim() : "";
  const candidates = [
    artigoField ? product[artigoField] : null,
    product.display_name,
    product.name,
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue;
    let title = candidate.trim();
    // Odoo name_get prefixes "[default_code] ". Ref is shown separately on the
    // storefront — drop that code prefix (exact SKU match, else any [code] head).
    if (sku) {
      const escaped = sku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      title = title.replace(new RegExp(`^\\[${escaped}\\]\\s*`, "i"), "").trim();
    }
    title = title.replace(/^\[[^\]]+\]\s*/, "").trim();
    if (title) return title;
  }
  return "Unnamed product";
}

async function variantAttributeMap(client: OdooClient, ids: number[]) {
  if (!ids.length) return new Map<number, { attribute: string; value: string }>();
  const rows = await client.searchRead(
    "product.template.attribute.value",
    [["id", "in", ids]],
    ["id", "name", "attribute_id"],
    { limit: ids.length }
  );
  const result = new Map<number, { attribute: string; value: string }>();
  for (const row of rows) {
    result.set(Number(row.id), {
      attribute: many2oneName(row.attribute_id).toLowerCase(),
      value: String(row.name || ""),
    });
  }
  return result;
}

function findAttribute(
  ids: number[],
  attributeMap: Map<number, { attribute: string; value: string }>,
  names: string[]
) {
  for (const id of ids) {
    const item = attributeMap.get(id);
    if (item && names.some((name) => item.attribute.includes(name))) {
      return item.value;
    }
  }
  return null;
}

function normalizeAttributeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasOpportunityAttribute(
  ids: number[],
  attributeMap: Map<number, { attribute: string; value: string }>
) {
  return ids.some((id) => {
    const item = attributeMap.get(id);
    if (!item) return false;
    const combined = normalizeAttributeText(`${item.attribute} ${item.value}`);
    return combined.includes("oportunidade");
  });
}

function isNewInAttributeName(value: string) {
  const normalized = normalizeAttributeText(value);
  return (
    normalized.includes("new in") ||
    normalized.includes("newin") ||
    normalized.includes("new arrival") ||
    normalized.includes("newarrival") ||
    normalized.includes("novidade")
  );
}

/** Match Odoo variant attribute/value tags like "New In", "Newin", "New Arrival", "Novidade(s)". */
function hasNewInAttribute(
  ids: number[],
  attributeMap: Map<number, { attribute: string; value: string }>
) {
  return ids.some((id) => {
    const item = attributeMap.get(id);
    if (!item) return false;
    return isNewInAttributeName(`${item.attribute} ${item.value}`);
  });
}

/**
 * Odoo "NEW IN" is configured as create_variant=no_variant, so it does not appear on
 * product.product.product_template_attribute_value_ids. Read template attribute lines instead.
 */
async function fetchNewInTemplateIds(client: OdooClient) {
  const attributes = await client.searchRead(
    "product.attribute",
    [],
    ["id", "name"],
    { limit: 300, order: "name" }
  );
  const attributeIds = attributes
    .filter((row) => isNewInAttributeName(String(row.name || "")))
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id) && id > 0);

  if (!attributeIds.length) return new Set<number>();

  const lines: Array<Record<string, unknown>> = [];
  let offset = 0;
  while (true) {
    const batch = await client.searchRead(
      "product.template.attribute.line",
      [["attribute_id", "in", attributeIds]],
      ["id", "product_tmpl_id", "value_ids"],
      { limit: 200, offset }
    );
    lines.push(...batch);
    if (batch.length < 200) break;
    offset += batch.length;
  }

  const templateIds = new Set<number>();
  for (const line of lines) {
    const templateId = Array.isArray(line.product_tmpl_id) ? Number(line.product_tmpl_id[0]) : 0;
    const valueIds = Array.isArray(line.value_ids) ? line.value_ids.map(Number) : [];
    // A template line with at least one value means the product is tagged New In (e.g. SIM).
    if (templateId > 0 && valueIds.length > 0) {
      templateIds.add(templateId);
    }
  }
  return templateIds;
}

function opportunityAttributeValue(
  ids: number[],
  attributeMap: Map<number, { attribute: string; value: string }>
) {
  for (const id of ids) {
    const item = attributeMap.get(id);
    if (!item) continue;
    const combined = `${item.attribute} ${item.value}`.toLowerCase();
    if (combined.includes("oportunidade")) return item.value;
  }
  return null;
}

function parseDiscountPercent(value: string | null) {
  if (!value) return null;
  const match = value.replace(",", ".").match(/(\d+(?:\.\d+)?)\s*%?/);
  if (!match) return null;

  const percent = Number(match[1]);
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return null;
  return Math.round(percent);
}

function hasOdooImage(value: unknown) {
  return typeof value === "string" && value.length > 0;
}

function numberField(product: OdooRow, fields: string[]) {
  for (const field of fields) {
    const raw = product[field];
    const value = Number(raw || 0);
    if (Number.isFinite(value) && value > 0) return { field, value };
  }
  return null;
}

export async function fetchOdooProducts(limit = 5000) {
  if (!hasOdooConfig()) return { configured: false, products: [] as SyncedOdooProduct[] };
  const client = new OdooClient();
  // One cached fields_get covers brand + price + image + artigo field discovery.
  await getModelFields(client, "product.product").catch(() => ({}));
  const [
    brandField,
    originalPriceFields,
    discountPercentFields,
    imagePresenceField,
    artigoField,
  ] = await Promise.all([
    availableField(client, "product.product", brandFieldCandidates),
    availableFields(client, "product.product", originalPriceFieldCandidates),
    availableFields(client, "product.product", discountPercentFieldCandidates),
    availableField(client, "product.product", imagePresenceFieldCandidates),
    resolveArtigoFieldName(client),
  ]);
  const fields = Array.from(new Set([
    ...productFields,
    ...(brandField ? [brandField] : []),
    ...(imagePresenceField ? [imagePresenceField] : []),
    ...(artigoField ? [artigoField] : []),
    ...originalPriceFields,
    ...discountPercentFields,
  ]));
  const products: OdooRow[] = [];
  let offset = 0;

  while (products.length < limit) {
    const batch = await client.searchRead(
      "product.product",
      [
        ["active", "=", true],
        ["sale_ok", "=", true],
      ],
      fields,
      { limit: Math.min(200, limit - products.length), offset, order: "categ_id,name" }
    );
    products.push(...batch);
    if (batch.length < 200) break;
    offset += batch.length;
  }

  const attributeIds = Array.from(
    new Set(
      products.flatMap((product) =>
        Array.isArray(product.product_template_attribute_value_ids)
          ? product.product_template_attribute_value_ids.map(Number)
          : []
      )
    )
  );
  const [attributes, newInTemplateIds] = await Promise.all([
    variantAttributeMap(client, attributeIds),
    fetchNewInTemplateIds(client),
  ]);

  const mappedProducts: SyncedOdooProduct[] = products.map((product) => {
    const qty = Math.max(0, Math.floor(Number(product.qty_available || 0)));
    const forecast = Math.floor(Number(product.virtual_available || 0));
    const saleable = Boolean(product.sale_ok);
    const attributeValueIds = Array.isArray(product.product_template_attribute_value_ids)
      ? product.product_template_attribute_value_ids.map(Number)
      : [];
    const category = many2oneName(product.categ_id, "Uncategorized");
    const brand = brandField ? many2oneName(product[brandField], "") || String(product[brandField] || "") : "";
    const sku = product.default_code ? String(product.default_code) : null;
    const templateId = Array.isArray(product.product_tmpl_id) ? Number(product.product_tmpl_id[0]) : null;
    const imageUrl = hasOdooImage(imagePresenceField ? product[imagePresenceField] : null)
      ? `/api/products/images/${product.id}`
      : "/brand/logo-stacked.svg";
    const name = resolveOdooArtigoName(product, artigoField);
    const brandLabel = brand || "Jhonny Surf Store";
    const excludedFromCatalog = foodBeverageExclusion({ name, category, brand: brandLabel });
    const enrichment = buildSurfboardEnrichment({ name, category, brand: brandLabel });
    const odooListPriceCents = cents(product.list_price);
    const opportunity = hasOpportunityAttribute(attributeValueIds, attributes);
    const newIn =
      hasNewInAttribute(attributeValueIds, attributes) ||
      (templateId != null && newInTemplateIds.has(templateId));
    const opportunityPercent = parseDiscountPercent(opportunityAttributeValue(attributeValueIds, attributes));
    const originalPrice = numberField(product, originalPriceFields);
    const discountPercent = numberField(product, discountPercentFields);
    const opportunityOriginalPriceCents = originalPrice ? cents(originalPrice.value) : null;
    const calculatedDiscountPercent = opportunityPercent
      ? opportunityPercent
      : opportunityOriginalPriceCents && opportunityOriginalPriceCents > odooListPriceCents
        ? Math.round(((opportunityOriginalPriceCents - odooListPriceCents) / opportunityOriginalPriceCents) * 100)
        : discountPercent
          ? Math.round(discountPercent.value)
          : null;
    const effectivePriceCents =
      opportunity && opportunityPercent
        ? Math.max(0, Math.round(odooListPriceCents * (1 - opportunityPercent / 100)))
        : odooListPriceCents;
    const displayOriginalPriceCents =
      opportunity && opportunityPercent
        ? odooListPriceCents
        : opportunityOriginalPriceCents && opportunityOriginalPriceCents > effectivePriceCents
          ? opportunityOriginalPriceCents
          : null;

    return {
      odooProductId: Number(product.id),
      odooProductTemplateId: templateId,
      slug: slugify(`odoo-${product.id}-${sku || product.name}`),
      sku,
      barcode: product.barcode ? String(product.barcode) : null,
      refId: sku || String(product.id),
      name,
      description: String(product.description_sale || product.description || ""),
      category,
      brand: brandLabel,
      size: findAttribute(attributeValueIds, attributes, ["size", "tamanho"]) || null,
      color: findAttribute(attributeValueIds, attributes, ["color", "colour", "cor"]) || null,
      imageUrl,
      // Store URL pointers only — avoid megabyte base64 payloads in Postgres/API responses.
      imageUrlsJson: JSON.stringify([imageUrl]),
      marketingDescription: enrichment?.marketingDescription || null,
      videoUrl: enrichment?.videoUrl || null,
      contentSourceName: enrichment?.contentSourceName || null,
      contentSourceUrl: enrichment?.contentSourceUrl || null,
      contentUpdatedAt: enrichment?.contentUpdatedAt || null,
      contentSyncStatus: enrichment?.contentSyncStatus || null,
      priceCents: effectivePriceCents,
      currency: "EUR",
      stockQuantity: qty,
      forecastQuantity: forecast,
      stockState: stockState(qty, saleable),
      saleable,
      availableForSale: saleable && qty > 0,
      active: true,
      excludedFromCatalog,
      exclusionReason: excludedFromCatalog ? "Food/beverage product excluded from website catalog." : null,
      isOpportunity: opportunity,
      isNewIn: newIn,
      opportunityOriginalPriceCents: displayOriginalPriceCents,
      opportunityDiscountPercent: calculatedDiscountPercent && calculatedDiscountPercent > 0 ? calculatedDiscountPercent : null,
      opportunitySource: opportunity
        ? opportunityPercent
          ? "Oportunidade attribute"
          : originalPrice?.field || discountPercent?.field || "Oportunidade attribute"
        : null,
      odooSyncStatus: "SYNCED",
      odooSyncError: null,
      lastOdooSyncAt: new Date(),
    };
  });

  return {
    configured: true,
    products: mappedProducts,
  };
}

export async function syncOdooProducts() {
  const result = await fetchOdooProducts();
  if (!result.configured) {
    return { configured: false, upserted: 0 };
  }

  let upserted = 0;
  const seenOdooIds = new Set<number>();
  for (const product of result.products) {
    seenOdooIds.add(product.odooProductId);
    await prisma.product.upsert({
      where: { odooProductId: product.odooProductId },
      update: product,
      create: product,
    });
    upserted += 1;
  }

  if (seenOdooIds.size && seenOdooIds.size <= 900) {
    await prisma.product.updateMany({
      where: {
        odooProductId: { notIn: Array.from(seenOdooIds) },
        odooSyncStatus: "SYNCED",
      },
      data: { active: false, odooSyncStatus: "NOT_SYNCED" },
    });
  }

  return { configured: true, upserted };
}
