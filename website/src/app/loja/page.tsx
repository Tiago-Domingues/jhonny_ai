import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { ShopClient } from "@/components/ShopClient";
import { ShopHero } from "@/components/ShopHero";

export const metadata: Metadata = {
  title: "Loja Online",
  description:
    "Loja online Jhonny Surf Store com catálogo, stock, filtros e checkout preparados para Odoo.",
};

function ShopCatalogFallback() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
      <div className="mb-8 flex flex-col items-center gap-3 py-10">
        <div className="shop-loader-wave" aria-hidden />
        <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-ink">
          A carregar catálogo
        </p>
        <p className="text-sm text-muted">A procurar o melhor equipamento para ti...</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
            <div className="shop-skeleton h-44 w-full" />
            <div className="space-y-3 p-4">
              <div className="shop-skeleton h-3 w-1/3 rounded-full" />
              <div className="shop-skeleton h-5 w-4/5 rounded-full" />
              <div className="shop-skeleton h-3 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ShopPageProps = {
  searchParams?: Promise<{
    categoryGroup?: string;
    subcategory?: string;
  }>;
};

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
          <ShopClient />
        </Suspense>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
