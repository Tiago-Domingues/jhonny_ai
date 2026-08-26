import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { CheckoutConfirmClient } from "@/components/CheckoutConfirmClient";

export const metadata: Metadata = {
  title: "Pagamento",
  description: "Confirmação de pagamento Stripe da Jhonny Surf Store.",
};

export default function CheckoutConfirmPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">Checkout</p>
          <h1 className="font-display mt-3 text-5xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl">
            Pagamento
          </h1>
          <div className="mt-10">
            <CheckoutConfirmClient />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
