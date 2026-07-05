import { listProducts } from "@/lib/ecommerce/catalog";
import { hasOdooConfig } from "@/lib/ecommerce/odooClient";

function centsFromParam(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
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
    inStockOnly: url.searchParams.get("stock") === "in",
    minPriceCents: centsFromParam(url.searchParams.get("minPrice")),
    maxPriceCents: centsFromParam(url.searchParams.get("maxPrice")),
  });
  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort();
  const brands = Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort();
  const sizes = Array.from(new Set(products.map((product) => product.size).filter(Boolean))).sort();
  const colors = Array.from(new Set(products.map((product) => product.color).filter(Boolean))).sort();

  return Response.json({
    products,
    filters: { categories, brands, sizes, colors },
    source: hasOdooConfig() ? "local_odoo_cache" : "local_or_mock",
    odooConfigured: hasOdooConfig(),
  });
}
