import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { ShopClient } from "@/components/ShopClient";

export const metadata: Metadata = {
  title: "Loja Online",
  description:
    "Loja online Jhonny Surf Store com catálogo, stock, filtros e checkout preparados para Odoo.",
};

function ShopFallback() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="shop-loader-wave" aria-hidden />
        <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-muted">
          A carregar catálogo...
        </p>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20">
        <Suspense fallback={<ShopFallback />}>
          <ShopClient />
        </Suspense>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
