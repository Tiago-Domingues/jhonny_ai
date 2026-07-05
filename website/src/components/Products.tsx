"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { categoryGroupHref, type CategoryGroupKey } from "@/lib/ecommerce/categoryGroups";
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

const categoryImages: Record<string, string> = {
  surfboards: "/brand/categories/cat-surfboards-user.jpeg",
  wetsuits: "/brand/categories/cat-wetsuits.jpg",
  surfgear: "/brand/categories/cat-surfgear-user.jpeg",
  essentials: "/brand/categories/cat-apparel.jpg",
  bodyboard: "/brand/categories/cat-bodyboard.jpg",
  lifestyle: "/brand/categories/cat-jss.jpg",
};

const categoryPhotoFallbacks: Record<string, string> = {
  surfboards: "https://source.unsplash.com/1200x800/?surfboard,surf",
  wetsuits: "https://source.unsplash.com/1200x800/?wetsuit,surf",
  surfgear: "https://source.unsplash.com/1200x800/?surf,gear",
  essentials: "https://source.unsplash.com/1200x800/?beach,surf",
  bodyboard: "https://source.unsplash.com/1200x800/?bodyboard,waves",
  lifestyle: "https://source.unsplash.com/1200x800/?surf,lifestyle",
};

const categorySvgFallbacks: Record<string, string> = {
  surfboards: "/brand/categories/cat-surfboards.svg",
  wetsuits: "/brand/categories/cat-wetsuits.svg",
  surfgear: "/brand/categories/cat-surfgear.svg",
  essentials: "/brand/categories/cat-essentials.svg",
  bodyboard: "/brand/categories/cat-bodyboard.svg",
  lifestyle: "/brand/categories/cat-lifestyle.svg",
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

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.shop.items.map((item, i) => {
            const Icon = icons[i] ?? SurfboardIcon;
            const localImage = categoryImages[item.id] || categoryImages.surfboards;
            const photoFallback = categoryPhotoFallbacks[item.id] || categoryPhotoFallbacks.surfboards;
            const svgFallback = categorySvgFallbacks[item.id] || categorySvgFallbacks.surfboards;
            return (
              <a
                key={item.id}
                id={item.id}
                href={categoryGroupHref(item.id as CategoryGroupKey)}
                className="group relative flex min-h-[280px] scroll-mt-24 flex-col justify-end overflow-hidden rounded-2xl border border-white/0 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-sand/60 hover:shadow-[0_24px_70px_rgba(8,37,55,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{
                    backgroundImage: `url('${localImage}'), url('${photoFallback}'), url('${svgFallback}')`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10 transition duration-500 group-hover:from-ink group-hover:via-ink/55" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(250,204,21,0.34),transparent_28%),linear-gradient(135deg,rgba(34,197,94,0.14),rgba(14,165,233,0.22)_52%,rgba(249,115,22,0.2))] opacity-0 mix-blend-screen transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-x-6 top-6 h-px origin-left scale-x-0 bg-gradient-to-r from-sand via-white/80 to-transparent transition-transform duration-500 group-hover:scale-x-100" />

                <div className="relative p-7 text-white">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/10 text-white backdrop-blur-sm transition duration-500 group-hover:rotate-[-6deg] group-hover:scale-110 group-hover:border-sand/80 group-hover:bg-sand/20">
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
            Loja online em base técnica: carrinho, checkout e pagamentos preparados para Odoo
          </span>
        </div>
      </div>
    </section>
  );
}
