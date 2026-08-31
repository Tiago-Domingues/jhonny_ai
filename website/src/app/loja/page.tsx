import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { ShopClient } from "@/components/ShopClient";
import { ShopCatalogFallback } from "@/components/ShopCatalogFallback";
import { ShopHero } from "@/components/ShopHero";
import { listProducts } from "@/lib/ecommerce/catalog";
import { listMenuCategories } from "@/lib/ecommerce/menuCategories";
import { getProductRatingSummaries } from "@/lib/ecommerce/ratings";

export const metadata: Metadata = {
  title: "Shop",
  description: "Jhonny Surf Store online shop — catalog, stock, filters, and checkout.",
};

export const revalidate = 30;

type ShopPageProps = {
  searchParams?: Promise<{
    categoryGroup?: string;
    subcategory?: string;
    q?: string;
    brand?: string;
  }>;
};

function firstBrand(value?: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

async function ShopCatalog({
  categoryGroup,
  subcategory,
  q,
  brand,
}: {
  categoryGroup?: string;
  subcategory?: string;
  q?: string;
  brand?: string;
}) {
  // Server-render a lean first page so the shop never boots empty if the client fetch is slow.
  // Cap SSR props; ShopClient then fetches at most 300 lean products, not the whole catalog.
  const [products, menuCategories] = await Promise.all([
    listProducts({
      categoryGroup: categoryGroup || null,
      subcategory: subcategory || null,
      query: q || null,
      brand: brand || null,
    })
      .then((items) => items.slice(0, 60))
      .catch(() => []),
    listMenuCategories().catch(() => []),
  ]);
  const ratings = await getProductRatingSummaries(products.map((product) => product.id)).catch(
    () => ({})
  );

  return (
    <ShopClient
      products={products}
      ratings={ratings}
      catalogKey={[categoryGroup || "", subcategory || "", q || "", brand || ""].join("|")}
      menuCategories={menuCategories}
    />
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = (await searchParams) || {};
  const brand = firstBrand(params.brand);

  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20">
        <ShopHero
          categoryGroup={params.categoryGroup}
          subcategory={params.subcategory}
        />
        <Suspense fallback={<ShopCatalogFallback />}>
          <ShopCatalog
            categoryGroup={params.categoryGroup}
            subcategory={params.subcategory}
            q={params.q}
            brand={brand}
          />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
