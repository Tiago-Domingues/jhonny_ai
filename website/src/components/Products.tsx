"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { categoryGroupHref, type CategoryGroupKey } from "@/lib/ecommerce/categoryGroups";
import { ArrowIcon } from "@/components/icons";

const CATEGORY_PHOTO_VERSION = "20260827";

const categoryImages: Record<string, string> = {
  surfboards: `/brand/categories/hero-surfboards.jpg?v=${CATEGORY_PHOTO_VERSION}`,
  wetsuits: `/brand/categories/hero-wetsuits.jpg?v=${CATEGORY_PHOTO_VERSION}`,
  surfgear: `/brand/categories/hero-surfgear.jpg?v=${CATEGORY_PHOTO_VERSION}`,
  essentials: `/brand/categories/hero-essentials.jpg?v=${CATEGORY_PHOTO_VERSION}`,
  bodyboard: `/brand/categories/hero-bodyboard.jpg?v=${CATEGORY_PHOTO_VERSION}`,
  clothing: `/brand/categories/hero-lifestyle.jpg?v=${CATEGORY_PHOTO_VERSION}`,
  jssMerch: `/brand/categories/hero-jss-merch.jpg?v=${CATEGORY_PHOTO_VERSION}`,
  travel: `/brand/categories/hero-travel.jpg?v=${CATEGORY_PHOTO_VERSION}`,
  surfskate: `/brand/categories/hero-surfskate.jpg?v=${CATEGORY_PHOTO_VERSION}`,
};

const categoryPhotoFallbacks: Record<string, string> = { ...categoryImages };

export function Products() {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section id="shop" className="scroll-mt-20 bg-paper py-20 text-ink sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            {t.shop.eyebrow}
          </p>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-balance sm:text-5xl">
            {t.shop.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            {t.shop.subtitle}
          </p>
        </div>

        <div
          data-category-grid
          data-category-focus={hoveredId ? "true" : undefined}
          onPointerLeave={() => setHoveredId(null)}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {t.shop.items.map((item) => {
            const localImage = categoryImages[item.id] || categoryImages.surfboards;
            const photoFallback = categoryPhotoFallbacks[item.id] || categoryPhotoFallbacks.surfboards;

            return (
              <a
                key={item.id}
                id={item.id}
                href={categoryGroupHref(item.id as CategoryGroupKey)}
                data-category-card
                data-category-active={hoveredId === item.id ? "true" : undefined}
                onMouseEnter={() => setHoveredId(item.id)}
                onPointerEnter={(event) => {
                  if (event.pointerType === "touch") return;
                  setHoveredId(item.id);
                }}
                className="group flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-line-dark bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                <div
                  className="media-vivid aspect-[4/3] w-full bg-cream bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${localImage}'), url('${photoFallback}')`,
                  }}
                  role="img"
                  aria-label={item.title}
                />

                <div
                  data-category-banner
                  className="flex flex-1 flex-col border border-ink bg-ink px-5 py-5 text-white transition-colors duration-300"
                >
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/80 transition-colors duration-300">
                    {item.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors duration-300">
                    {t.shop.explore}
                    <ArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
