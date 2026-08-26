import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";
import { AdminOrdersClient } from "@/components/AdminOrdersClient";

export const metadata: Metadata = {
  title: "Admin · Encomendas",
  description: "Gerir encomendas da Jhonny Surf Store.",
  robots: { index: false, follow: false },
};

export default function AdminEncomendasPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">Admin Jhonny</p>
          <h1 className="font-display mt-3 text-5xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl">
            Encomendas
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Acompanha encomendas em curso, pagamento e fulfillment, e atualiza o estado operacional.
          </p>
          <AdminNav />
          <div className="mt-10">
            <AdminOrdersClient />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
