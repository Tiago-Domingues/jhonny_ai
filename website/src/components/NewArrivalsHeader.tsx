"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const copy = {
  pt: {
    eyebrow: "Acabou de chegar",
    title: "New In",
    subtitle:
      "Seleção especial do Jhonny — as novidades que ele escolheu à mão para a próxima sessão. Chegou agora à loja. Não deixes escapar.",
    shopAll: "Ver tudo",
  },
  en: {
    eyebrow: "Just landed",
    title: "New In",
    subtitle:
      "Jhonny’s pick — fresh arrivals he chose himself for your next session. Straight from the shop floor. Get them while they’re hot.",
    shopAll: "Shop all",
  },
  zh: {
    eyebrow: "刚刚到店",
    title: "New In",
    subtitle:
      "Jhonny 亲自精选的新品——为下一次下海准备的好物，刚到店就上架。手慢无。",
    shopAll: "查看全部",
  },
} as const;

export function NewArrivalsHeader() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          {t.eyebrow}
        </p>
        <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-ink sm:text-5xl">
          {t.title}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          {t.subtitle}
        </p>
      </div>
      <Link
        href="/loja?stock=in"
        className="rounded-full border border-line bg-white px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink transition hover:bg-cream"
      >
        {t.shopAll}
      </Link>
    </div>
  );
}
