"use client";

import { useState } from "react";
import Image from "next/image";
import { InstagramMediaStrip } from "@/components/InstagramMediaStrip";
import { useLanguage } from "@/components/LanguageProvider";
import { whatsappHref } from "@/lib/i18n";
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
  whatsappHref(msg);

const surfSchoolLinks: Link[] = [
  { label: "@tainha_surfproject", href: "https://www.instagram.com/tainha_surfproject/" },
  { label: "@linhasurfschool", href: "https://www.instagram.com/linhasurfschool/" },
  { label: "@positivewavesurfschool", href: "https://www.instagram.com/positivewavesurfschool/" },
  { label: "@saltysoulsportugal", href: "https://www.instagram.com/saltysoulsportugal/" },
  { label: "@surflisbon1", href: "https://www.instagram.com/surflisbon1/" },
  { label: "@surfingclubedeportugal", href: "https://www.instagram.com/surfingclubedeportugal/" },
  { label: "@salsurfingschool", href: "https://www.instagram.com/salsurfingschool/" },
  { label: "@fours_surfschool", href: "https://www.instagram.com/fours_surfschool/" },
  { label: "@triple_tide", href: "https://www.instagram.com/triple_tide/" },
];

function DudesAvatar() {
  const instagramAvatarUrl = "/api/instagram/dudes_surfcafe/avatar";
  const [photoSrc, setPhotoSrc] = useState(instagramAvatarUrl);
  return (
    <a
      href="https://www.instagram.com/dudes_surfcafe/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open The Dudes Surf Café Instagram"
      className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {photoSrc ? (
        <Image
          src={photoSrc}
          alt="The Dudes — Surf Café"
          fill
          sizes="112px"
          unoptimized
          onError={() =>
            setPhotoSrc((current) =>
              current === instagramAvatarUrl ? "/brand/partners/dudes.svg" : ""
            )
          }
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-ink via-ink-soft to-muted text-white">
          <span className="font-display text-2xl font-extrabold uppercase">
            TD
          </span>
          <span className="mt-1 text-[0.55rem] font-bold uppercase tracking-wide text-white/65">
            Surf Café
          </span>
        </div>
      )}
    </a>
  );
}

function PartnerChip({ link }: { link: Link }) {
  const [hasLogo, setHasLogo] = useState(Boolean(link.logo));

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-ink/30 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold uppercase tracking-wide text-ink transition hover:bg-ink hover:text-white"
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
      <span className="truncate">{link.label}</span>
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
      {
        label: "@a.s.b.repairs.surfboards",
        href: "https://www.instagram.com/a.s.b.repairs.surfboards/",
        logo: "asbrepairs",
      },
    ],
    [{ label: t.services.buyback, href: wa(t.services.buybackMsg), wa: true }],
    [],
    [
      {
        label: "@underdogz",
        href: "https://www.instagram.com/underdogz/",
        logo: "underdogz",
      },
      {
        label: "@seasoulscommunity",
        href: "https://www.instagram.com/seasoulscommunity/",
      },
    ],
    [
      { label: "Nova Surf Club", href: "https://www.instagram.com/novasurfclub/", logo: "novasurfclub" },
      { label: "MadSurf Club", href: "https://www.instagram.com/madsurfclub/", logo: "madsurfclub" },
      { label: "Erasmus Life Lisboa", href: "https://www.erasmuslifelisboa.com/", logo: "erasmuslifelisboa" },
    ],
  ];
  const serviceCards = [
    ...t.services.items.map((item, i) => ({
      title: item.title,
      desc: item.desc,
      Icon: icons[i] ?? AdviceIcon,
      actions: links[i] ?? [],
    })),
    {
      title: "Surf schools",
      desc: "Trusted school partners around Carcavelos and Lisbon that help new surfers get safely into the water.",
      Icon: StudentIcon,
      actions: surfSchoolLinks,
    },
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
          {serviceCards.map(({ title, desc, Icon, actions }) => {
            return (
              <div
                key={title}
                className="group rounded-2xl border border-line bg-white/70 px-4 pb-5 pt-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:bg-cream hover:shadow-md"
              >
                <Icon className="h-8 w-8 text-ink transition-transform duration-200 group-hover:scale-110" />
                <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-ink transition-all group-hover:font-extrabold group-hover:tracking-wider">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {desc}
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

        {/* The Dudes — Surf Café highlight */}
        <div className="mt-12 grid gap-6 rounded-2xl border border-line bg-cream p-6 sm:p-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-8 sm:text-left">
            <DudesAvatar />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
                {t.dudes.eyebrow}
              </p>
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
                {t.dudes.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                {t.dudes.desc}
              </p>
              <a
                href="https://www.instagram.com/dudes_surfcafe/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/30 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:bg-ink hover:text-white"
              >
                <InstagramIcon className="h-4 w-4" />
                @dudes_surfcafe
              </a>
              <p className="mt-2 text-xs text-muted">
                Live post images appear here after Instagram Graph credentials are added.
              </p>
            </div>
          </div>
          <InstagramMediaStrip handle="dudes_surfcafe" label="Latest Instagram posts" />
        </div>
      </div>
    </section>
  );
}
