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

function DeliveryCarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 24" className={className} aria-hidden fill="currentColor">
      <path d="M2.5 13.2h2.2l1.4-4.5A2.8 2.8 0 0 1 8.8 6.8h14.2a2.8 2.8 0 0 1 2.7 1.85l1.7 4.1H36.5l1.45-2A2.4 2.4 0 0 1 40 9.3h8.2A2.8 2.8 0 0 1 51 12.1v4.6a1.6 1.6 0 0 1-1.6 1.6h-1.9a3.9 3.9 0 0 1-7.6 0H19.3a3.9 3.9 0 0 1-7.6 0H4.1A1.6 1.6 0 0 1 2.5 16.7v-3.5Zm11 5.6a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Zm26.8 0a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4ZM38 12H48.5v2.4H37l1-2.4Zm-12.2-3.2H9.1l-1.1 3.7h20.5l-2.7-3.7Z" />
    </svg>
  );
}

export function DispatchBanner() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <div className="border-t border-line">
      <div className="bg-white text-ink">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-center text-[0.65rem] font-bold uppercase tracking-[0.18em] sm:text-[0.72rem] sm:tracking-[0.22em]">
          <span>{t.dispatch}</span>
          <span aria-hidden className="hidden text-muted sm:inline">
            ·
          </span>
          <span>{t.shipping}</span>
        </p>
      </div>

      <div className="relative h-9 overflow-hidden bg-ink text-white sm:h-10" aria-hidden>
        <div className="dispatch-road absolute inset-x-4 top-1/2 h-px -translate-y-1/2 sm:inset-x-8" />
        <div className="dispatch-plane absolute top-[2px] flex items-center sm:top-[3px]">
          <AirplaneIcon className="h-3.5 w-7 text-white sm:h-4 sm:w-8" />
          <span className="dispatch-plane-trail ml-0.5 h-px w-8 bg-gradient-to-r from-white/45 to-transparent sm:w-12" />
        </div>
        <div className="dispatch-car absolute bottom-[2px] flex items-center sm:bottom-[3px]">
          <DeliveryCarIcon className="h-3.5 w-8 text-white sm:h-4 sm:w-9" />
        </div>
      </div>
    </div>
  );
}
