"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const messages = {
  pt: [
    "Pronto para envio em 24–48 horas!",
    "Portes grátis em encomendas acima de €50",
    "Usa os cupões Local Hero para descontos",
  ],
  en: [
    "Ready for dispatch in 24–48 hours!",
    "Free shipping on orders over €50",
    "Use our Local Hero coupons for discounts",
  ],
  zh: [
    "24–48 小时内可发货！",
    "订单满 €50 免运费",
    "使用 Local Hero 优惠码享受折扣",
  ],
} as const;

const ROTATE_MS = 10_000;
const FADE_MS = 280;

export function DispatchBanner() {
  const { locale } = useLanguage();
  const lines = messages[locale];
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setIndex(0);
    setVisible(true);
  }, [locale]);

  useEffect(() => {
    let fadeTimer: number | undefined;

    const rotateTimer = window.setInterval(() => {
      setVisible(false);
      fadeTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % lines.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      window.clearInterval(rotateTimer);
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
    };
  }, [lines.length, locale]);

  return (
    <div className="border-t border-line bg-white text-ink">
      <p
        className="flex min-h-[2.5rem] items-center justify-center px-4 py-2.5 text-center text-[0.65rem] font-bold uppercase tracking-[0.16em] sm:text-[0.7rem] sm:tracking-[0.2em]"
        aria-live="polite"
      >
        <span
          className={[
            "inline-block transition-all duration-300 ease-out",
            visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
          ].join(" ")}
        >
          {lines[index]}
        </span>
      </p>
    </div>
  );
}
