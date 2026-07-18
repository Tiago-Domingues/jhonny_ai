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
type ServiceCard = {
  title: string;
  desc: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  actions: Link[];
  wide?: boolean;
};

const wa = (msg: string) =>
  whatsappHref(msg);

const surfSchoolLinks: Link[] = [
  { label: "@tainha.surfproject", href: "https://www.instagram.com/tainha.surfproject/", logo: "/brand/partners/instagram/tainha-surfproject.jpg" },
  { label: "@linhasurfschool", href: "https://www.instagram.com/linhasurfschool/", logo: "/brand/partners/instagram/linhasurfschool.jpg" },
  { label: "@positivewavesurfschool", href: "https://www.instagram.com/positivewavesurfschool/", logo: "/brand/partners/instagram/positivewavesurfschool.jpg" },
  { label: "@saltysoulsportugal", href: "https://www.instagram.com/saltysoulsportugal/", logo: "/brand/partners/instagram/saltysoulsportugal.jpg" },
  { label: "@surflisbon1", href: "https://www.instagram.com/surflisbon1/", logo: "/brand/partners/instagram/surflisbon1.jpg" },
  { label: "@surfingclubeportugal", href: "https://www.instagram.com/surfingclubeportugal/", logo: "/brand/partners/instagram/surfingclubeportugal.jpg" },
  { label: "@salsurfingschool", href: "https://www.instagram.com/salsurfingschool/", logo: "/brand/partners/instagram/salsurfingschool.jpg" },
  { label: "@fours_surfschool", href: "https://www.instagram.com/fours_surfschool/", logo: "/brand/partners/instagram/fours-surfschool.jpg" },
  { label: "@triple_tide", href: "https://www.instagram.com/triple_tide/", logo: "/brand/partners/instagram/triple-tide.jpg" },
];

function instagramHandleFromHref(href: string) {
  try {
    const url = new URL(href);
    if (!url.hostname.includes("instagram.com")) return null;
    const handle = url.pathname.split("/").filter(Boolean)[0];
    return handle && /^[a-zA-Z0-9._]+$/.test(handle) ? handle : null;
  } catch {
    return null;
  }
}

function DudesAvatar() {
  const instagramAvatarUrl = "/brand/partners/instagram/dudes-surfcafe.jpg";
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
  const instagramHandle = instagramHandleFromHref(link.href);
  const staticLogoSrc = link.logo
    ? link.logo.startsWith("/")
      ? link.logo
      : `/brand/partners/${link.logo}.png`
    : "";
  const primaryLogoSrc = staticLogoSrc || (instagramHandle
    ? `/api/instagram/${encodeURIComponent(instagramHandle)}/avatar?variant=chip`
    : "");
  const [logoSrc, setLogoSrc] = useState(primaryLogoSrc);

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/30 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white hover:text-ink"
    >
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/10">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={link.label}
            width={28}
            height={28}
            unoptimized={logoSrc.startsWith("/api/")}
            onError={() =>
              setLogoSrc((current) =>
                current !== staticLogoSrc && staticLogoSrc ? staticLogoSrc : ""
              )
            }
            className="h-7 w-7 object-cover"
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
      { label: "@fibercrw", href: "https://www.instagram.com/fibercrw/", logo: "/brand/partners/instagram/fibercrw.jpg" },
      {
        label: "@a.s.b.repairs.surfboards",
        href: "https://www.instagram.com/a.s.b.repairs.surfboards/",
        logo: "/brand/partners/instagram/asbrepairs.jpg",
      },
    ],
    [{ label: t.services.buyback, href: wa(t.services.buybackMsg), wa: true }],
    [],
    [
      {
        label: "@underdogz",
        href: "https://www.instagram.com/underdogz/",
        logo: "/brand/partners/instagram/underdogz.jpg",
      },
      {
        label: "@seasoulscommunity",
        href: "https://www.instagram.com/seasoulscommunity/",
        logo: "/brand/partners/instagram/seasoulscommunity.jpg",
      },
    ],
    [
      { label: "Nova Surf Club", href: "https://www.instagram.com/novasurfclub/", logo: "/brand/partners/instagram/novasurfclub.jpg" },
      { label: "MadSurf Club", href: "https://www.instagram.com/madsurfclub/", logo: "/brand/partners/instagram/madsurfclub.jpg" },
      { label: "Erasmus Life Lisboa", href: "https://www.erasmuslifelisboa.com/", logo: "/brand/partners/instagram/erasmuslifelisboa.png" },
    ],
  ];
  const serviceCards: ServiceCard[] = [
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
      wide: true,
    },
  ];

  return (
    <section id="services" className="scroll-mt-20 bg-paper py-20 text-ink sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            {t.services.eyebrow}
          </p>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-balance sm:text-5xl">
            {t.services.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            {t.services.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceCards.map(({ title, desc, Icon, actions, wide }) => {
            return (
              <div
                key={title}
                className={[
                  "group min-h-[220px] rounded-2xl border border-ink bg-ink px-5 pb-5 pt-5 text-white transition-all duration-300 hover:-translate-y-1 hover:border-ink-soft",
                  wide ? "sm:col-span-2 lg:col-span-3" : "",
                ].join(" ")}
              >
                <div className={wide ? "flex h-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between" : ""}>
                  <div className={wide ? "max-w-md" : ""}>
                    <Icon className="h-8 w-8 text-white transition-transform duration-200 group-hover:scale-110" />
                    <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-white transition-all group-hover:font-extrabold group-hover:tracking-wider">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">
                      {desc}
                    </p>
                  </div>

                  {actions.length > 0 && (
                    <div className={wide ? "flex flex-1 flex-wrap gap-2 lg:mt-1 lg:justify-end" : "mt-4 flex flex-wrap gap-2"}>
                      {actions.map((a) => (
                        <PartnerChip key={a.label} link={a} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* The Dudes — Surf Café highlight */}
        <div className="mt-12 grid gap-6 rounded-2xl border border-ink bg-ink p-6 text-white sm:p-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-8 sm:text-left">
            <DudesAvatar />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                {t.dudes.eyebrow}
              </p>
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
                {t.dudes.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
                {t.dudes.desc}
              </p>
              <a
                href="https://www.instagram.com/dudes_surfcafe/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white hover:text-ink"
              >
                <InstagramIcon className="h-4 w-4" />
                @dudes_surfcafe
              </a>
              <p className="mt-2 text-xs text-white/45">
                Profile image loads from Instagram; post tiles open the café profile.
              </p>
            </div>
          </div>
          <InstagramMediaStrip handle="dudes_surfcafe" label="Latest Instagram posts" />
        </div>
      </div>
    </section>
  );
}
