"use client";

import { useLanguage } from "@/components/LanguageProvider";

const loadingCopy = {
  pt: {
    title: "A carregar catálogo",
    subtitle: "A procurar o melhor equipamento para ti...",
  },
  en: {
    title: "Loading catalog",
    subtitle: "Finding the right gear for you...",
  },
  zh: {
    title: "正在加载目录",
    subtitle: "正在为你挑选装备...",
  },
} as const;

export function ShopCatalogFallback() {
  const { locale } = useLanguage();
  const copy = loadingCopy[locale] || loadingCopy.en;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
      <div className="mb-8 flex flex-col items-center gap-3 py-10">
        <div className="shop-loader-wave" aria-hidden />
        <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-ink">
          {copy.title}
        </p>
        <p className="text-sm text-muted">{copy.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
            <div className="shop-skeleton h-44 w-full" />
            <div className="space-y-3 p-4">
              <div className="shop-skeleton h-3 w-1/3 rounded-full" />
              <div className="shop-skeleton h-5 w-4/5 rounded-full" />
              <div className="shop-skeleton h-3 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
