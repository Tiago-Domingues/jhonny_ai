"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { shopAllLinkClassName } from "@/components/NewArrivalsHeader";

const copy = {
  pt: {
    eyebrow: "Em promoção",
    title: "Opportunities",
    subtitle:
      "Apanha as oportunidades — peças selecionadas com desconto por tempo limitado. Novidades da loja a preços melhores.",
    shopAll: "Ver tudo",
    salePrice: "Preço em promoção",
    emptyTitle: "Sem oportunidades de momento",
    emptyBody: "Volta em breve — novas peças em promoção entram regularmente na loja.",
  },
  en: {
    eyebrow: "On sale",
    title: "Opportunities",
    subtitle:
      "Score the deals — selected pieces marked down for a limited run. Fresh drops from the shop floor at better prices.",
    shopAll: "Shop all",
    salePrice: "Sale price",
    emptyTitle: "No deals right now",
    emptyBody: "Check back soon — fresh discounted pieces land here regularly.",
  },
  zh: {
    eyebrow: "特惠",
    title: "Opportunities",
    subtitle: "限时特惠精选——店内精选单品限时降价，把握入手良机。",
    shopAll: "查看全部",
    salePrice: "特惠价",
    emptyTitle: "暂无特惠",
    emptyBody: "稍后再来——限时折扣单品会定期上架。",
  },
} as const;

export function OpportunitiesHeader() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          {t.eyebrow}
        </p>
        <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-ink sm:text-5xl">
          {t.title}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          {t.subtitle}
        </p>
      </div>
      <Link href="/loja?stock=in" className={shopAllLinkClassName}>
        {t.shopAll}
      </Link>
    </div>
  );
}

export function OpportunitiesSaleNote() {
  const { locale } = useLanguage();
  return <p className="text-xs text-muted">{copy[locale].salePrice}</p>;
}

export function OpportunitiesEmpty() {
  const { locale } = useLanguage();
  const t = copy[locale];
  return (
    <div className="mx-auto mt-10 max-w-7xl px-5 sm:px-8">
      <div className="rounded-3xl border border-dashed border-line bg-white p-6 text-sm text-muted sm:p-8">
        <p className="font-bold uppercase tracking-wide text-ink">{t.emptyTitle}</p>
        <p className="mt-2 max-w-2xl">{t.emptyBody}</p>
      </div>
    </div>
  );
}
