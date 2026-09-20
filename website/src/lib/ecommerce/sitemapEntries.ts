import type { MetadataRoute } from "next";

export const SITEMAP_SITE = "https://www.jhonnysurfstore.pt";

export const SITEMAP_STATIC_PATHS = [
  "",
  "/loja",
  "/faq",
  "/termos",
  "/privacidade",
  "/pagamentos-e-envios",
  "/trocas-e-devolucoes",
  "/garantia",
  "/erasmus",
  "/reportar-fraude",
  "/calculadora-volume",
] as const;

export function staticSitemapEntries(): MetadataRoute.Sitemap {
  return SITEMAP_STATIC_PATHS.map((path) => ({
    url: `${SITEMAP_SITE}${path || "/"}`,
    changeFrequency: path === "/loja" ? "hourly" : "weekly",
    priority: path === "" ? 1 : path === "/loja" ? 0.9 : 0.5,
  }));
}

export function productSitemapEntries(
  products: Array<{ slug: string; updatedAt: Date }>
): MetadataRoute.Sitemap {
  return products.map((product) => ({
    url: `${SITEMAP_SITE}/loja/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
}

/** Catalog outages must not abort `next build` — Vercel prerenders /sitemap.xml. */
export async function withSitemapCatalogFallback<T>(
  load: () => Promise<T[]>,
  onError?: (error: unknown) => void
): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    onError?.(error);
    return [];
  }
}
