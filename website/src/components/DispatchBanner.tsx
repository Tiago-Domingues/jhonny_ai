"use client";

import { useLanguage } from "@/components/LanguageProvider";

const copy = {
  pt: "Pronto para envio em 24–48 horas!",
  en: "Ready for dispatch in 24–48 hours!",
} as const;

export function DispatchBanner() {
  const { locale } = useLanguage();

  return (
    <div className="border-t border-line bg-white text-ink">
      <p className="px-4 py-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.22em] sm:text-[0.7rem]">
        {copy[locale]}
      </p>
    </div>
  );
}
