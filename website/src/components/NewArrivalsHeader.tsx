"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const copy = {
  pt: {
    eyebrow: "Acabou de chegar",
    title: "New In",
    subtitle:
      "Seleção especial do Jhonny — as novidades que ele escolheu à mão para a próxima sessão. Chegou agora à loja. Não deixes escapar.",
    shopAll: "Ver tudo",
  },
  en: {
    eyebrow: "Just landed",
    title: "New In",
    subtitle:
      "Jhonny’s pick — fresh arrivals he chose himself for your next session. Straight from the shop floor. Get them while they’re hot.",
    shopAll: "Shop all",
  },
  zh: {
    eyebrow: "刚刚到店",
    title: "New In",
    subtitle:
      "Jhonny 亲自精选的新品——为下一次下海准备的好物，刚到店就上架。手慢无。",
    shopAll: "查看全部",
  },
} as const;

function JhonnyOnButton() {
  const [toySrc, setToySrc] = useState("/brand/jhonny-character-cut.png");

  return (
    <span className="newin-jhonny pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2" aria-hidden>
      <span className="newin-jhonny__rider relative block">
        <span className="newin-jhonny__shadow absolute bottom-0 left-1/2 h-1.5 w-7 -translate-x-1/2 rounded-full bg-ink/20 blur-[1.5px]" />
        <Image
          src={toySrc}
          alt=""
          width={120}
          height={150}
          onError={() => setToySrc("/brand/jhonny-character-cut.svg")}
          className="newin-jhonny__toy relative block h-11 w-auto object-contain drop-shadow-md sm:h-12"
        />
      </span>
    </span>
  );
}

export function NewArrivalsHeader() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
        {t.eyebrow}
      </p>

      <div className="flex items-end justify-between gap-4 sm:gap-6">
        <h2 className="font-display min-w-0 text-4xl font-extrabold uppercase tracking-tight text-ink sm:text-5xl">
          {t.title}
        </h2>

        <div className="newin-shop-cta shrink-0">
          <Link
            href="/loja?stock=in"
            className="newin-shop-cta__btn group relative inline-flex items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-ink-soft"
          >
            <JhonnyOnButton />
            {t.shopAll}
          </Link>
        </div>
      </div>

      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
        {t.subtitle}
      </p>
    </div>
  );
}
