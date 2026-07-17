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

export default function ShopPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-32">
        <section className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
            Loja online
          </p>
          <h1 className="font-display mt-3 text-5xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl">
            Compra como local
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Catálogo preparado para Odoo com categorias, stock, filtros por marca/tamanho/cor e checkout online com recolha em loja.
          </p>
          <div className="mt-12">
            <Suspense fallback={<p className="text-sm font-semibold text-muted">A carregar catálogo Odoo...</p>}>
              <ShopClient />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
