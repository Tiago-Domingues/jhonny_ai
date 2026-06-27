"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  SurfboardIcon,
  WetsuitIcon,
  AccessoryIcon,
  ShirtIcon,
  TravelIcon,
  WaveIcon,
  ArrowIcon,
} from "@/components/icons";

const icons = [
  SurfboardIcon,
  WetsuitIcon,
  AccessoryIcon,
  ShirtIcon,
  TravelIcon,
  WaveIcon,
];

export function Products() {
  const { t } = useLanguage();

  return (
    <section id="shop" className="scroll-mt-20 bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            {t.shop.eyebrow}
          </p>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-ink text-balance sm:text-5xl">
            {t.shop.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            {t.shop.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.shop.items.map((item, i) => {
            const Icon = icons[i] ?? SurfboardIcon;
            return (
              <a
                key={item.id}
                id={item.id === "jss" ? "jss-line" : item.id}
                href="#contact"
                className="group relative flex min-h-[280px] scroll-mt-24 flex-col justify-end overflow-hidden rounded-2xl"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('/brand/categories/cat-${item.id}.jpg')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10 transition group-hover:from-ink group-hover:via-ink/55" />

                <div className="relative p-7 text-white">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/10 text-white backdrop-blur-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide drop-shadow">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/85">
                    {item.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                    {t.shop.explore}
                    <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-ink/30 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t.shop.soon}
          </span>
        </div>
      </div>
    </section>
  );
}
