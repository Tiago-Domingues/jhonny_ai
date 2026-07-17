import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { AccountClient } from "@/components/AccountClient";

export const metadata: Metadata = {
  title: "A Minha Conta",
  description: "Conta de cliente Jhonny Surf Store para perfil, moradas, consentimentos e compras.",
};

export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
            Cliente Jhonny
          </p>
          <h1 className="font-display mt-3 text-5xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl">
            A minha conta
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Regista-te, entra ou compra como convidado. Os dados ficam na base de clientes do website e ficam preparados para sincronização futura com Odoo.
          </p>
          <div className="mt-10">
            <AccountClient />
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
