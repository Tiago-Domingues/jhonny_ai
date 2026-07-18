"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover object-center"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/brand/surf-hero-poster.jpg?v=wa-2026-07-18"
        aria-hidden
      >
        <source src="/brand/surf-hero.mp4?v=wa-2026-07-18" type="video/mp4" />
      </video>

      {/* Soft overlays — keep the new footage colorful while text stays readable */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-ink/30" />
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-ink/60 via-ink/25 to-transparent sm:w-3/4 lg:w-2/3" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-36 sm:px-8">
        <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-white/75 sm:text-xs">
          {t.hero.eyebrow}
        </p>

        <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-tight text-white text-balance sm:text-7xl lg:text-[6.5rem]">
          {t.hero.title1}
          <br />
          {t.hero.title2}
        </h1>

        <p className="mt-7 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          {t.hero.subtitle}
        </p>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 sm:block">
        <div className="flex h-9 w-6 items-start justify-center rounded-full border border-white/40 p-1.5">
          <span className="h-2 w-1 animate-float-slow rounded-full bg-white/70" />
        </div>
      </div>
    </section>
  );
}
