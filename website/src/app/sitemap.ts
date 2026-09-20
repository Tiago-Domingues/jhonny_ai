import type { MetadataRoute } from "next";
import { publicCatalogWhere } from "@/lib/ecommerce/catalog";
import { isSitePubliclyLaunched } from "@/lib/ecommerce/siteAccess";
import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import {
  productSitemapEntries,
  staticSitemapEntries,
  withSitemapCatalogFallback,
} from "@/lib/ecommerce/sitemapEntries";

export const revalidate = 3600;

export async function listSitemapProductEntries(): Promise<MetadataRoute.Sitemap> {
  if (!hasDatabaseUrl()) return [];

  return withSitemapCatalogFallback(async () => {
    const products = await prisma.product.findMany({
      where: publicCatalogWhere(),
      select: { slug: true, updatedAt: true },
      take: 8000,
    });
    return productSitemapEntries(products);
  }, (error) => {
    console.error("[sitemap] catalog unavailable; publishing static URLs only", error);
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSitePubliclyLaunched()) {
    return [];
  }

  const productEntries = await listSitemapProductEntries();
  return [...staticSitemapEntries(), ...productEntries];
}
