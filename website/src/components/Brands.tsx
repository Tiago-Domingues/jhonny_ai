"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { BRANDS, type Brand } from "@/lib/i18n";

function BrandItem({ brand }: { brand: Brand }) {
  const [hasIcon, setHasIcon] = useState(true);

  return (
    <div className="group relative mx-8 flex h-12 w-36 shrink-0 items-center justify-center sm:mx-10">
      <span
        className={`absolute whitespace-nowrap font-display text-lg font-bold uppercase tracking-wide text-white/70 transition-opacity duration-300 ${
          hasIcon ? "group-hover:opacity-0" : ""
        }`}
      >
        {brand.name}
      </span>
      {hasIcon && (
        <Image
          src={`/brand/brands/${brand.slug}.png`}
          alt={brand.name}
          width={140}
          height={48}
          onError={() => setHasIcon(false)}
          className="max-h-10 w-auto max-w-[140px] object-contain opacity-0 brightness-0 invert transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
    </div>
  );
}

export function Brands() {
  const { t } = useLanguage();
  const loop = [...BRANDS, ...BRANDS];

  return (
    <section className="overflow-hidden bg-ink py-14">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/55">
        {t.brands.title}
      </p>

      <div className="group relative mt-8 flex overflow-hidden">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent sm:w-28" />

        <div className="flex w-max animate-[marquee_40s_linear_infinite] items-center group-hover:[animation-play-state:paused]">
          {loop.map((brand, i) => (
            <BrandItem key={`${brand.slug}-${i}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}
