"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { categoryGroupHref, type CategoryGroupKey } from "@/lib/ecommerce/categoryGroups";
import { ArrowIcon } from "@/components/icons";
import { BorderSurfer } from "@/components/BorderSurfer";

const categoryImages: Record<string, string> = {
  surfboards: "/brand/categories/hero-surfboards.jpg",
  wetsuits: "/brand/categories/hero-wetsuits.jpg",
  surfgear: "/brand/categories/hero-surfgear.jpg",
  essentials: "/brand/categories/hero-essentials.jpg",
  bodyboard: "/brand/categories/hero-bodyboard.jpg",
  lifestyle: "/brand/categories/hero-lifestyle.png",
};

const categoryPhotoFallbacks: Record<string, string> = {
  surfboards: "/brand/categories/cat-surfboards.jpg",
  wetsuits: "/brand/categories/cat-wetsuits.jpg",
  surfgear: "/brand/categories/cat-technical.jpg",
  essentials: "/brand/categories/cat-apparel.jpg",
  bodyboard: "/brand/categories/cat-bodyboard.jpg",
  lifestyle: "/brand/categories/cat-jss.jpg",
};

export function Products() {
  const { t } = useLanguage();

  return (
    <section
      id="shop"
      className="relative scroll-mt-20 overflow-hidden bg-ink py-20 text-white sm:py-28"
    >
      {/* Paper → black wave transition from the previous light section */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden">
        <div className="animate-ocean-border absolute -top-10 left-0 h-[4.5rem] w-[220%] text-paper">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0 0H1200V42C1110 18 1050 18 960 42S810 66 720 42S570 18 480 42S330 66 240 42S90 18 0 42V0Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="animate-ocean-border absolute top-5 left-0 h-14 w-[220%]">
          <svg viewBox="0 0 1200 56" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0 20C90 4 150 4 240 20S390 44 480 20S630 4 720 20S870 44 960 20S1110 4 1200 20V56H0Z"
              fill="#0d0d0d"
            />
            <path
              d="M0 24C90 10 150 10 240 24S390 42 480 24S630 10 720 24S870 42 960 24S1110 10 1200 24"
              fill="none"
              stroke="#0d0d0d"
              strokeWidth="3"
              opacity="0.9"
            />
          </svg>
        </div>
        <div className="animate-surf-border absolute top-[0.85rem] left-0">
          <BorderSurfer />
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pt-8 sm:px-8 sm:pt-10">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            {t.shop.eyebrow}
          </p>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-balance sm:text-5xl">
            {t.shop.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">
            {t.shop.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.shop.items.map((item) => {
            const localImage = categoryImages[item.id] || categoryImages.surfboards;
            const photoFallback = categoryPhotoFallbacks[item.id] || categoryPhotoFallbacks.surfboards;

            return (
              <a
                key={item.id}
                id={item.id}
                href={categoryGroupHref(item.id as CategoryGroupKey)}
                className="group flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <div
                  className="aspect-[4/3] w-full bg-cream bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${localImage}'), url('${photoFallback}')`,
                  }}
                  role="img"
                  aria-label={item.title}
                />

                <div className="flex flex-1 flex-col bg-white px-5 py-5 text-ink">
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {item.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink">
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
