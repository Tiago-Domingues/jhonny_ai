import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { CheckoutClient } from "@/components/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Checkout Jhonny Surf Store com convidado, conta, MB WAY, Multibanco, PayPal, Klarna e pickup em loja.",
};

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-32">
        <section className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">Checkout</p>
          <h1 className="font-display mt-3 text-5xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl">
            Finalizar compra
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Compra como convidado ou com conta. Podes pagar online e levantar na loja em Carcavelos.
          </p>
          <div className="mt-10">
            <CheckoutClient />
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
