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
    invite: "Vamos!",
  },
  en: {
    eyebrow: "Just landed",
    title: "New In",
    subtitle:
      "Jhonny’s pick — fresh arrivals he chose himself for your next session. Straight from the shop floor. Get them while they’re hot.",
    shopAll: "Shop all",
    invite: "Let's go!",
  },
  zh: {
    eyebrow: "刚刚到店",
    title: "New In",
    subtitle:
      "Jhonny 亲自精选的新品——为下一次下海准备的好物，刚到店就上架。手慢无。",
    shopAll: "查看全部",
    invite: "冲呀！",
  },
} as const;

function JhonnyShopInvite({ label }: { label: string }) {
  const [toySrc, setToySrc] = useState("/brand/jhonny-character-cut.png");

  return (
    <div className="newin-jhonny pointer-events-none absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 flex-col items-center" aria-hidden>
      <span className="newin-jhonny__invite mb-0.5 rounded-full bg-ink px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-white">
        {label}
      </span>
      <span className="newin-jhonny__logo relative mb-0.5">
        <Image
          src="/brand/logo-mark.png"
          alt=""
          width={48}
          height={48}
          className="h-5 w-5 object-contain sm:h-6 sm:w-6"
        />
      </span>
      <span className="newin-jhonny__rider relative">
        <span className="newin-jhonny__shadow absolute bottom-0 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-ink/15 blur-[2px]" />
        <Image
          src={toySrc}
          alt=""
          width={120}
          height={150}
          onError={() => setToySrc("/brand/jhonny-character-cut.svg")}
          className="newin-jhonny__toy relative h-12 w-auto object-contain drop-shadow-sm sm:h-14"
        />
      </span>
    </div>
  );
}

export function NewArrivalsHeader() {
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

      <div className="newin-shop-cta group relative self-start sm:self-end">
        <JhonnyShopInvite label={t.invite} />
        <Link
          href="/loja?stock=in"
          className="relative z-[1] inline-flex rounded-full border border-ink bg-ink px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition group-hover:bg-ink-soft"
        >
          {t.shopAll}
        </Link>
      </div>
    </div>
  );
}
