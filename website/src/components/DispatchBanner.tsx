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

/** Cargo / delivery plane — reads as shipping, not a fighter jet. */
function CargoPlaneIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 28" className={className} aria-hidden fill="currentColor">
      {/* Fuselage */}
      <path d="M4 14.5c0-1.4 1-2.5 2.4-2.7l28-3.2c1.2-.14 2.4.3 3.2 1.2l6.8 7.4H58c1.4 0 2.5 1.2 2.5 2.6v1.2c0 .7-.6 1.3-1.3 1.3H38.2L30 26.4c-.7.5-1.6.6-2.4.3l-5.2-2.1H8.2C5.9 24.6 4 22.7 4 20.3v-5.8Z" />
      {/* Wing */}
      <path d="M22 12.2 34.5 3.4c.7-.5 1.7-.4 2.3.3l2.2 2.6c.5.6.4 1.5-.2 2L28.5 16" opacity="0.92" />
      {/* Tail */}
      <path d="M8.2 12.2 4.4 6.8c-.35-.5 0-1.2.6-1.2h2.1c.4 0 .8.2 1 .6l3.4 5.8" opacity="0.9" />
      {/* Cargo stripe */}
      <rect x="14" y="15.2" width="16" height="2.2" rx="0.6" opacity="0.35" />
      {/* Nose package cue */}
      <rect x="48.5" y="12.8" width="5.5" height="4.2" rx="0.7" opacity="0.55" />
    </svg>
  );
}

function PackageIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M3.5 8.2 12 3.5l8.5 4.7v9.6L12 22.5 3.5 17.8V8.2Z" opacity="0.95" />
      <path d="M12 3.5v19M3.5 8.2 12 13l8.5-4.8" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
    </svg>
  );
}

function DeliveryVanIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 32" className={className} aria-hidden fill="currentColor">
      {/* Cargo box */}
      <rect x="2" y="6" width="38" height="16" rx="2.2" />
      {/* Cab */}
      <path d="M40 12h12.5l7 7.2V22H40V12Z" />
      <path d="M42.2 13.6h9.2l4.6 4.8H42.2v-4.8Z" opacity="0.3" />
      {/* Bumper / base */}
      <rect x="2" y="20.5" width="58" height="3.2" rx="1" />
      {/* Wheels */}
      <circle cx="14" cy="25.5" r="4.2" />
      <circle cx="14" cy="25.5" r="1.7" opacity="0.25" />
      <circle cx="50" cy="25.5" r="4.2" />
      <circle cx="50" cy="25.5" r="1.7" opacity="0.25" />
      {/* “JSS” delivery mark */}
      <rect x="8" y="10" width="14" height="7" rx="1" opacity="0.28" />
    </svg>
  );
}

export function DispatchBanner() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <div className="dispatch-banner relative overflow-hidden border-t border-line bg-white text-ink">
      <p className="relative z-[1] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-3.5 text-center text-[0.65rem] font-bold uppercase tracking-[0.18em] sm:py-4 sm:text-[0.72rem] sm:tracking-[0.22em]">
        <span>{t.dispatch}</span>
        <span aria-hidden className="hidden text-muted sm:inline">
          ·
        </span>
        <span>{t.shipping}</span>
      </p>

      {/*
        Delivery story (loop):
        1) Cargo plane flies L→R to the end of the text and lands
        2) Package appears at the landing spot
        3) Van comes from the right, picks up, continues off to the right
        mix-blend difference keeps icons black on white / white over type.
      */}
      <div className="pointer-events-none absolute inset-0 z-[2] text-white" aria-hidden>
        <div className="dispatch-plane absolute top-[3px] flex items-center sm:top-[4px]">
          <CargoPlaneIcon className="h-5 w-12 sm:h-6 sm:w-14" />
        </div>
        <div className="dispatch-package absolute bottom-[5px] flex items-center sm:bottom-[6px]">
          <PackageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
        <div className="dispatch-van absolute bottom-[2px] flex items-center sm:bottom-[3px]">
          <DeliveryVanIcon className="h-5 w-12 sm:h-6 sm:w-[3.35rem]" />
        </div>
      </div>
    </div>
  );
}
