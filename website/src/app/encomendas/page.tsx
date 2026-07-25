import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { OrdersClient } from "@/components/OrdersClient";

export const metadata: Metadata = {
  title: "As minhas encomendas",
  description: "Consulta o estado das tuas encomendas Jhonny Surf Store com conta ou por email e número de encomenda.",
};

export default function OrdersPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">Encomendas</p>
          <h1 className="font-display mt-3 text-5xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl">
            As minhas compras
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Vê o histórico se tiveres conta, ou procura uma encomenda com o email e o número da compra.
          </p>
          <div className="mt-10">
            <OrdersClient />
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
