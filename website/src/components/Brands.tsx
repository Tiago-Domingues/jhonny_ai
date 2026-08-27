"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { BRANDS, type Brand } from "@/lib/i18n";
import { shopBrandHref, visibleShopBrands, type ShopBrandLink } from "@/lib/ecommerce/brandShopLinks";

function shopBrandLabel(brand: Brand, locale: string) {
  if (locale === "pt") return `${brand.name} — ver produtos na loja`;
  if (locale === "zh") return `${brand.name} — 查看商店产品`;
  return `Shop ${brand.name} products`;
}

function BrandItem({ brand }: { brand: ShopBrandLink }) {
  const [failed, setFailed] = useState(false);
  const { locale } = useLanguage();
  const label = shopBrandLabel(brand, locale);

  return (
    <a
      href={shopBrandHref(brand.catalogBrand)}
      aria-label={label}
      data-testid={`brand-link-${brand.slug}`}
      className="mx-8 flex h-14 w-40 shrink-0 items-center justify-center sm:mx-10 sm:w-44"
    >
      {failed ? (
        <span className="whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.18em] text-white/75 sm:text-base">
          {brand.name}
        </span>
      ) : (
        <Image
          src={`/brand/brands/${brand.slug}.png`}
          alt={brand.name}
          width={180}
          height={72}
          unoptimized
          onError={() => setFailed(true)}
          className="max-h-10 w-auto max-w-[160px] object-contain opacity-90 transition duration-300 hover:opacity-100 sm:max-h-11"
        />
      )}
    </a>
  );
}

export function Brands({ catalogBrands }: { catalogBrands: string[] }) {
  const { t } = useLanguage();
  const visible = visibleShopBrands(BRANDS, catalogBrands);
  if (!visible.length) return null;

  const loop = [...visible, ...visible];

  return (
    <section className="overflow-hidden bg-ink py-14" data-testid="brands-we-carry">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/55">
        {t.brands.title}
      </p>

      <div className="group relative mt-8 flex overflow-hidden">
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
