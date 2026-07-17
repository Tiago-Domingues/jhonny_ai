import Image from "next/image";
import { getCategoryHero } from "@/lib/ecommerce/categoryHeroes";
import { displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";
import { STORE } from "@/lib/i18n";

type ShopHeroProps = {
  categoryGroup?: string;
  subcategory?: string;
  locale?: "pt" | "en";
};

export function ShopHero({ categoryGroup, subcategory, locale = "en" }: ShopHeroProps) {
  const hero = getCategoryHero(categoryGroup);
  const title = locale === "pt" ? hero.labelPt : hero.labelEn;
  const subtitle = locale === "pt" ? hero.subtitlePt : hero.subtitleEn;
  const subcategoryLabel = subcategory ? displayOdooCategoryName(subcategory) : null;

  return (
    <section className="relative isolate overflow-hidden bg-ink pt-28 text-white sm:pt-32">
      <div className="absolute inset-0">
        <Image
          key={hero.image}
          src={hero.image}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="shop-hero-media object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[42vw] max-w-7xl flex-col justify-end px-5 pb-12 pt-16 sm:min-h-[320px] sm:px-8 sm:pb-14">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/75">
          {STORE.name}
        </p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl font-extrabold uppercase tracking-tight sm:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
          {subtitle}
        </p>
        {subcategoryLabel && (
          <p className="mt-5 inline-flex w-fit rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-sm">
            {subcategoryLabel}
          </p>
        )}
      </div>
    </section>
  );
}
