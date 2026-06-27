"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { STORE } from "@/lib/i18n";
import {
  AdviceIcon,
  RepairIcon,
  BuybackIcon,
  RentalIcon,
  TravelIcon,
  StudentIcon,
  ArrowIcon,
  InstagramIcon,
  WhatsappIcon,
} from "@/components/icons";

const icons = [
  AdviceIcon,
  RepairIcon,
  BuybackIcon,
  RentalIcon,
  TravelIcon,
  StudentIcon,
];

type Link = { label: string; href: string; logo?: string; wa?: boolean };

const wa = (msg: string) =>
  `https://wa.me/${STORE.phoneRaw}?text=${encodeURIComponent(msg)}`;

function PartnerChip({ link }: { link: Link }) {
  const [hasLogo, setHasLogo] = useState(Boolean(link.logo));

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold uppercase tracking-wide text-ink transition hover:bg-ink hover:text-white"
    >
      <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-ink/5">
        {hasLogo && link.logo ? (
          <Image
            src={`/brand/partners/${link.logo}.png`}
            alt={link.label}
            width={24}
            height={24}
            onError={() => setHasLogo(false)}
            className="h-6 w-6 object-cover"
          />
        ) : link.wa ? (
          <WhatsappIcon className="h-3.5 w-3.5" />
        ) : (
          <InstagramIcon className="h-3.5 w-3.5" />
        )}
      </span>
      {link.label}
      <ArrowIcon className="h-3.5 w-3.5" />
    </a>
  );
}

export function Services() {
  const { t } = useLanguage();

  // Action links per service, indexed to t.services.items.
  const links: Link[][] = [
    [{ label: t.services.ask, href: wa(t.services.askMsg), wa: true }],
    [
      { label: "@fibercrw", href: "https://www.instagram.com/fibercrw/", logo: "fibercrw" },
      { label: "@asbrepairs", href: "https://www.instagram.com/asbrepairs/", logo: "asbrepairs" },
    ],
    [{ label: t.services.buyback, href: wa(t.services.buybackMsg), wa: true }],
    [],
    [],
    [
      { label: "Nova Surf Club", href: "https://www.instagram.com/novasurfclub/", logo: "novasurfclub" },
      { label: "MadSurf Club", href: "https://www.instagram.com/madsurfclub/", logo: "madsurfclub" },
      { label: "Erasmus Life Lisboa", href: "https://www.erasmuslifelisboa.com/", logo: "erasmuslifelisboa" },
    ],
  ];

  return (
    <section id="services" className="scroll-mt-20 bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            {t.services.eyebrow}
          </p>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-ink text-balance sm:text-5xl">
            {t.services.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            {t.services.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.services.items.map((item, i) => {
            const Icon = icons[i] ?? AdviceIcon;
            const actions = links[i] ?? [];
            return (
              <div
                key={item.title}
                className="group rounded-xl border-t-2 border-line px-4 pb-5 pt-5 transition-all duration-200 hover:-translate-y-1 hover:border-ink hover:bg-cream hover:shadow-md"
              >
                <Icon className="h-8 w-8 text-ink transition-transform duration-200 group-hover:scale-110" />
                <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-ink transition-all group-hover:font-extrabold group-hover:tracking-wider">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.desc}
                </p>

                {actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {actions.map((a) => (
                      <PartnerChip key={a.label} link={a} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
