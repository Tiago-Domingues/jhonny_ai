"use client";

import { useSearchParams } from "next/navigation";
import { AdminNav, type AdminTab } from "@/components/AdminNav";
import { AdminCustomersClient } from "@/components/AdminCustomersClient";
import { AdminOrdersClient } from "@/components/AdminOrdersClient";
import { AdminAnalyticsClient } from "@/components/AdminAnalyticsClient";

const titles: Record<AdminTab, { title: string; intro: string }> = {
  clientes: {
    title: "Clientes",
    intro: "Vê quem se registou na loja, pesquisa por contacto, filtra por Google/password e atualiza dados de perfil.",
  },
  encomendas: {
    title: "Encomendas",
    intro: "Acompanha encomendas em curso, pagamento e fulfillment, e atualiza o estado operacional.",
  },
  analytics: {
    title: "Analytics",
    intro: "Vê de onde vêm as visitas, que páginas performam melhor e a atividade recente no site.",
  },
};

export function AdminShell() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const tab: AdminTab = raw === "encomendas" || raw === "analytics" || raw === "clientes" ? raw : "clientes";
  const copy = titles[tab];

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">Admin Jhonny</p>
      <h1 className="font-display mt-3 text-5xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{copy.intro}</p>
      <AdminNav tab={tab} />
      <div className="mt-10">
        {tab === "clientes" && <AdminCustomersClient />}
        {tab === "encomendas" && <AdminOrdersClient />}
        {tab === "analytics" && <AdminAnalyticsClient />}
      </div>
    </section>
  );
}
