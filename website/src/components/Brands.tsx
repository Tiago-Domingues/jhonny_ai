"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { BRANDS, type Brand } from "@/lib/i18n";

type Pos = {
  left: string;
  top: string;
  dur: string;
  delay: string;
  dx: string;
  dy: string;
  rot: string;
};

// Deterministic spread (avoids SSR/client hydration mismatch).
const POSITIONS: Pos[] = [
  { left: "3%", top: "12%", dur: "15s", delay: "0s", dx: "12px", dy: "-16px", rot: "-4deg" },
  { left: "20%", top: "40%", dur: "18s", delay: "1.2s", dx: "-14px", dy: "12px", rot: "3deg" },
  { left: "36%", top: "8%", dur: "16s", delay: "0.6s", dx: "10px", dy: "14px", rot: "2deg" },
  { left: "54%", top: "34%", dur: "20s", delay: "2s", dx: "-12px", dy: "-12px", rot: "-3deg" },
  { left: "72%", top: "10%", dur: "17s", delay: "0.3s", dx: "14px", dy: "12px", rot: "4deg" },
  { left: "86%", top: "44%", dur: "19s", delay: "1.6s", dx: "-10px", dy: "-14px", rot: "-2deg" },
  { left: "10%", top: "68%", dur: "21s", delay: "0.9s", dx: "12px", dy: "14px", rot: "3deg" },
  { left: "28%", top: "78%", dur: "16s", delay: "2.4s", dx: "-14px", dy: "-10px", rot: "-4deg" },
  { left: "46%", top: "62%", dur: "18s", delay: "0.2s", dx: "10px", dy: "-14px", rot: "2deg" },
  { left: "63%", top: "76%", dur: "22s", delay: "1.1s", dx: "-12px", dy: "12px", rot: "-3deg" },
  { left: "80%", top: "70%", dur: "17s", delay: "2.8s", dx: "14px", dy: "-12px", rot: "4deg" },
  { left: "90%", top: "16%", dur: "20s", delay: "0.7s", dx: "-10px", dy: "14px", rot: "-2deg" },
  { left: "14%", top: "26%", dur: "19s", delay: "1.9s", dx: "12px", dy: "12px", rot: "3deg" },
  { left: "50%", top: "16%", dur: "16s", delay: "1.4s", dx: "-14px", dy: "-12px", rot: "-3deg" },
];

function BrandChip({ brand, pos }: { brand: Brand; pos: Pos }) {
  const [hasIcon, setHasIcon] = useState(true);

  return (
    <div
      className="animate-brand absolute -translate-x-1/2 -translate-y-1/2 hover:[animation-play-state:paused]"
      style={
        {
          left: pos.left,
          top: pos.top,
          "--dur": pos.dur,
          "--delay": pos.delay,
          "--dx": pos.dx,
          "--dy": pos.dy,
          "--rot": pos.rot,
        } as React.CSSProperties
      }
    >
      <div className="group relative flex h-12 cursor-default items-center justify-center transition-transform hover:scale-110">
        <span className="whitespace-nowrap font-display text-base font-bold uppercase tracking-wide text-ink/45 transition-opacity duration-300 group-hover:opacity-0 sm:text-lg">
          {brand.name}
        </span>
        {hasIcon && (
          <Image
            src={`/brand/brands/${brand.slug}.png`}
            alt={brand.name}
            width={120}
            height={48}
            onError={() => setHasIcon(false)}
            className="absolute inset-0 m-auto h-10 w-auto max-w-[130px] object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
      </div>
    </div>
  );
}

export function Brands() {
  const { t } = useLanguage();

  return (
    <section className="overflow-hidden bg-cream py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          {t.brands.title}
        </p>

        {/* Animated floating cloud (md and up) */}
        <div className="relative mt-6 hidden h-[420px] w-full sm:block">
          {BRANDS.map((brand, i) => (
            <BrandChip
              key={brand.slug}
              brand={brand}
              pos={POSITIONS[i % POSITIONS.length]}
            />
          ))}
        </div>

        {/* Tidy static fallback (mobile) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:hidden">
          {BRANDS.map((brand) => (
            <span
              key={brand.slug}
              className="font-display text-base font-bold uppercase tracking-wide text-ink/55"
            >
              {brand.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
