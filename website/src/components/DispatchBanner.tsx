"use client";

import { useLanguage } from "@/components/LanguageProvider";

const copy = {
  pt: {
    dispatch: "Pronto para envio em 24–48 horas!",
    shipping: "Portes grátis em encomendas acima de €50",
  },
  en: {
    dispatch: "Ready for dispatch in 24–48 hours!",
    shipping: "Free shipping on orders over €50",
  },
  zh: {
    dispatch: "24–48 小时内可发货！",
    shipping: "订单满 €50 免运费",
  },
} as const;

export function DispatchBanner() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <div className="border-t border-line bg-white text-ink">
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.18em] sm:text-[0.7rem] sm:tracking-[0.22em]">
        <span>{t.dispatch}</span>
        <span aria-hidden className="hidden text-muted sm:inline">
          ·
        </span>
        <span>{t.shipping}</span>
      </p>
    </div>
  );
}
