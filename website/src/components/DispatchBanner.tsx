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

function AirplaneIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 20" className={className} aria-hidden fill="currentColor">
      <path d="M46.5 9c.9.35.9 1.15 0 1.5L31 16.2a1.1 1.1 0 0 1-1.35-.45l-2-3.7-9.2 2.2 1.35 2.85a1 1 0 0 1-1.2.75L13.4 16l-2.7.65a.9.9 0 0 1-1.1-.8l.25-2.2-6.4-1.65a.85.85 0 0 1 0-1.6l6.4-1.65-.25-2.2a.9.9 0 0 1 1.1-.8l2.7.65 5.2-2.1-1.35-2.85a1 1 0 0 1 1.2-.75l9.2 2.2 2-3.7A1.1 1.1 0 0 1 31 2.3L46.5 9Z" />
    </svg>
  );
}

export function DispatchBanner() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <div className="dispatch-banner relative overflow-hidden border-t border-line bg-white text-ink">
      <p className="relative z-[1] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-3 text-center text-[0.65rem] font-bold uppercase tracking-[0.18em] sm:text-[0.72rem] sm:tracking-[0.22em]">
        <span>{t.dispatch}</span>
        <span aria-hidden className="hidden text-muted sm:inline">
          ·
        </span>
        <span>{t.shipping}</span>
      </p>

      {/*
        White plane + mix-blend difference:
        - over the white bar → reads as black
        - over black type → inverts to white, so both plane and text stay visible
      */}
      <div
        className="dispatch-plane pointer-events-none absolute inset-y-0 left-0 z-[2] flex items-center text-white"
        aria-hidden
      >
        <AirplaneIcon className="h-4 w-9 sm:h-[18px] sm:w-10" />
      </div>
    </div>
  );
}
