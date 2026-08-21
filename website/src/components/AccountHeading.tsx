"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { storefrontText } from "@/lib/storefrontCopy";

export function AccountHeading() {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).account;
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">{copy.kicker}</p>
      <h1 className="font-display mt-3 text-5xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{copy.intro}</p>
    </>
  );
}
