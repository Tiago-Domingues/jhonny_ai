import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Admin Jhonny",
  description: "Gerir clientes, encomendas e analytics da Jhonny Surf Store.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-w-0 overflow-x-hidden bg-cream pb-20 pt-36">
        <Suspense fallback={<p className="mx-auto max-w-6xl px-5 text-sm text-muted">A carregar admin…</p>}>
          <AdminShell />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
