import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";
import { AdminCustomersClient } from "@/components/AdminCustomersClient";

export const metadata: Metadata = {
  title: "Admin · Clientes",
  description: "Gerir clientes registados na Jhonny Surf Store.",
  robots: { index: false, follow: false },
};

export default function AdminClientesPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">Admin Jhonny</p>
          <h1 className="font-display mt-3 text-5xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl">
            Clientes
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Vê quem se registou na loja, pesquisa por contacto, filtra por Google/password e atualiza dados de perfil.
          </p>
          <AdminNav />
          <div className="mt-10">
            <AdminCustomersClient />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
