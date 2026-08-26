import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { ShopClient } from "@/components/ShopClient";
import { ShopCatalogFallback } from "@/components/ShopCatalogFallback";
import { ShopHero } from "@/components/ShopHero";
import { listProducts } from "@/lib/ecommerce/catalog";
import { listMenuCategories } from "@/lib/ecommerce/menuCategories";

export const metadata: Metadata = {
  title: "Loja Online",
  description:
    "Loja online Jhonny Surf Store com catálogo, stock, filtros e checkout preparados para Odoo.",
};

export const dynamic = "force-dynamic";

type ShopPageProps = {
  searchParams?: Promise<{
    categoryGroup?: string;
    subcategory?: string;
    q?: string;
  }>;
};

async function ShopCatalog({
  categoryGroup,
  subcategory,
  q,
}: {
  categoryGroup?: string;
  subcategory?: string;
  q?: string;
}) {
  // Server-render a lean first page so the shop never boots empty if the client fetch is slow.
  // Cap SSR props to keep the HTML/RSC payload small; ShopClient still fetches the full lean catalog.
  const [products, menuCategories] = await Promise.all([
    listProducts({
      categoryGroup: categoryGroup || null,
      subcategory: subcategory || null,
      query: q || null,
    })
      .then((items) => items.slice(0, 60))
      .catch(() => []),
    listMenuCategories().catch(() => []),
  ]);

  return (
    <ShopClient
      products={products}
      catalogKey={[categoryGroup || "", subcategory || "", q || ""].join("|")}
      menuCategories={menuCategories}
    />
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = (await searchParams) || {};

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
          />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
