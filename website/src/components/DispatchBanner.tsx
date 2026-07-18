"use client";

import { useLanguage } from "@/components/LanguageProvider";

const copy = {
  pt: {
    dispatch: "Pronto para envio em 24–48 horas!",
    shipping: "Portes grátis em encomendas acima de €50",
    coupons: "Usa os cupões Local Hero para descontos nas tuas encomendas",
  },
  en: {
    dispatch: "Ready for dispatch in 24–48 hours!",
    shipping: "Free shipping on orders over €50",
    coupons: "Use our Local Hero coupons for discounts on your orders",
  },
  zh: {
    dispatch: "24–48 小时内可发货！",
    shipping: "订单满 €50 免运费",
    coupons: "使用 Local Hero 优惠码享受订单折扣",
  },
} as const;

export function DispatchBanner() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <div className="border-t border-line bg-white text-ink">
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-center text-[0.65rem] font-bold uppercase tracking-[0.16em] sm:text-[0.7rem] sm:tracking-[0.2em]">
        <span>{t.dispatch}</span>
        <span aria-hidden className="hidden text-muted sm:inline">
          ·
        </span>
        <span>{t.shipping}</span>
        <span aria-hidden className="hidden text-muted sm:inline">
          ·
        </span>
        <span>{t.coupons}</span>
      </p>
    </div>
  );
}
