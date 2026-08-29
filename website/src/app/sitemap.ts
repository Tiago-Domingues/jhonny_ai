import type { MetadataRoute } from "next";
import { isSitePubliclyLaunched } from "@/lib/ecommerce/siteAccess";
import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";

const SITE = "https://www.jhonnysurfstore.pt";

const STATIC_PATHS = [
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
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSitePubliclyLaunched()) {
    return [];
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE}${path || "/"}`,
    changeFrequency: path === "/loja" ? "hourly" : "weekly",
    priority: path === "" ? 1 : path === "/loja" ? 0.9 : 0.5,
  }));

  if (!hasDatabaseUrl()) {
    return staticEntries;
  }

  const products = await prisma.product.findMany({
    where: { active: true, excludedFromCatalog: false },
    select: { slug: true, updatedAt: true },
    take: 8000,
  });

  return [
    ...staticEntries,
    ...products.map((product) => ({
      url: `${SITE}/loja/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
