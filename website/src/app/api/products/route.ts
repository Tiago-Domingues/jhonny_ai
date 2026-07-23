import { listProducts, toLeanStoreProduct, type StoreProduct } from "@/lib/ecommerce/catalog";
import { hasOdooConfig } from "@/lib/ecommerce/odooClient";

export const maxDuration = 30;

function centsFromParam(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

/** Drop null/empty list fields so ~2k products stay under client download budgets. */
function toCompactListProduct(product: StoreProduct) {
  const lean = toLeanStoreProduct(product);
  return {
    id: lean.id,
    slug: lean.slug,
    name: lean.name,
    category: lean.category,
    brand: lean.brand,
    imageUrl: lean.imageUrl,
    priceCents: lean.priceCents,
    currency: lean.currency,
    stockQuantity: lean.stockQuantity,
    availableForSale: lean.availableForSale !== false,
    ...(lean.sku ? { sku: lean.sku } : {}),
    ...(lean.refId ? { refId: lean.refId } : {}),
    ...(lean.size ? { size: lean.size } : {}),
    ...(lean.color ? { color: lean.color } : {}),
    ...(lean.forecastQuantity != null ? { forecastQuantity: lean.forecastQuantity } : {}),
    ...(lean.stockState ? { stockState: lean.stockState } : {}),
    ...(lean.saleable != null ? { saleable: lean.saleable } : {}),
    ...(lean.isOpportunity ? { isOpportunity: true } : {}),
    ...(lean.isNewIn ? { isNewIn: true } : {}),
    ...(lean.opportunityOriginalPriceCents != null
      ? { opportunityOriginalPriceCents: lean.opportunityOriginalPriceCents }
      : {}),
    ...(lean.opportunityDiscountPercent != null
      ? { opportunityDiscountPercent: lean.opportunityDiscountPercent }
      : {}),
    ...(lean.odooProductId != null ? { odooProductId: lean.odooProductId } : {}),
    ...(lean.createdAt ? { createdAt: lean.createdAt } : {}),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const products = await listProducts({
    query: url.searchParams.get("q"),
    category: url.searchParams.get("category"),
    categoryGroup: url.searchParams.get("categoryGroup"),
    subcategory: url.searchParams.get("subcategory"),
    brand: url.searchParams.get("brand"),
    size: url.searchParams.get("size"),
    color: url.searchParams.get("color"),
    inStockOnly: url.searchParams.get("stock") === "in" || url.searchParams.get("availability") === "in",
    minPriceCents: centsFromParam(url.searchParams.get("minPrice")),
    maxPriceCents: centsFromParam(url.searchParams.get("maxPrice")),
  });

  // Belt-and-suspenders: never ship enrichment blobs on the list endpoint.
  const leanProducts = products.map(toCompactListProduct);
  const categories = Array.from(new Set(leanProducts.map((product) => product.category).filter(Boolean))).sort();
  const brands = Array.from(new Set(leanProducts.map((product) => product.brand).filter(Boolean))).sort();
  const sizes = Array.from(new Set(leanProducts.map((product) => product.size).filter(Boolean))).sort();
  const colors = Array.from(new Set(leanProducts.map((product) => product.color).filter(Boolean))).sort();

  return Response.json(
    {
      products: leanProducts,
      filters: { categories, brands, sizes, colors },
      source: hasOdooConfig() ? "local_odoo_cache" : "local_or_mock",
      odooConfigured: hasOdooConfig(),
      count: leanProducts.length,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
