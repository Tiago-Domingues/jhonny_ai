"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { categoryGroupHref, type CategoryGroupKey } from "@/lib/ecommerce/categoryGroups";
import { ArrowIcon } from "@/components/icons";

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

/** Solid accent colors for each of the 6 shop categories. */
const categoryColors: Record<string, string> = {
  surfboards: "#0B4F6C",
  wetsuits: "#1F6F5B",
  surfgear: "#C45C26",
  essentials: "#2F5D8C",
  bodyboard: "#B84A3A",
  lifestyle: "#3D3A36",
};

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

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.shop.items.map((item) => {
            const localImage = categoryImages[item.id] || categoryImages.surfboards;
            const photoFallback = categoryPhotoFallbacks[item.id] || categoryPhotoFallbacks.surfboards;
            const accent = categoryColors[item.id] || categoryColors.surfboards;

            return (
              <a
                key={item.id}
                id={item.id}
                href={categoryGroupHref(item.id as CategoryGroupKey)}
                className="group flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                {/* Full-color photo — no overlays, filters, or hover effects on top */}
                <div
                  className="aspect-[4/3] w-full bg-cover bg-center"
                  style={{
                    backgroundColor: accent,
                    backgroundImage: `url('${localImage}'), url('${photoFallback}')`,
                  }}
                  role="img"
                  aria-label={item.title}
                />

                <div className="flex flex-1 flex-col px-5 py-5 text-white" style={{ backgroundColor: accent }}>
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/85">
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
            Loja online em base técnica: carrinho, checkout e pagamentos preparados para Odoo
          </span>
        </div>
      </div>
    </section>
  );
}
