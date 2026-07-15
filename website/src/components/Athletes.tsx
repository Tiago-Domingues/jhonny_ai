"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { ATHLETES, type Athlete } from "@/lib/athletes";
import { InstagramIcon } from "@/components/icons";

function AthleteCard({ a }: { a: Athlete }) {
  const [photoSrc, setPhotoSrc] = useState(a.photo);

  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative mx-3 block aspect-[3/4] w-60 shrink-0 overflow-hidden rounded-2xl border border-line-dark bg-ink-soft shadow-lg transition duration-300 hover:-translate-y-1.5 hover:border-white/30 hover:shadow-2xl sm:w-64"
    >
      <Image
        src={photoSrc}
        alt={a.name}
        width={512}
        height={680}
        unoptimized={photoSrc.startsWith("/api/") || photoSrc.endsWith(".svg")}
        onError={() => {
          setPhotoSrc((current) =>
            current === a.photo ? a.instagramAvatarUrl : current
          );
        }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* gradient for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

      {/* Instagram badge */}
      <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-white group-hover:text-ink">
        <InstagramIcon className="h-4 w-4" />
      </span>

      {/* text */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-display text-xl font-extrabold uppercase leading-tight tracking-wide text-white drop-shadow">
          {a.name}
        </p>
        <p className="mt-1 text-sm text-white/75">{a.bio}</p>
        <p className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white">
          10% code: {a.couponCode}
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/55 transition group-hover:text-white">
          @{a.handle}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </p>
      </div>
    </a>
  );
}

export function Athletes() {
  const { t } = useLanguage();
  const loop = [...ATHLETES, ...ATHLETES];

  return (
    <section id="team" className="scroll-mt-20 overflow-hidden bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            {t.athletes.eyebrow}
          </p>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-balance sm:text-5xl">
            {t.athletes.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">
            {t.athletes.subtitle}
          </p>
        </div>
      </div>

      <div className="group relative mt-12 flex overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-ink to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-ink to-transparent sm:w-24" />
        <div className="flex w-max animate-[marquee_50s_linear_infinite] items-stretch group-hover:[animation-play-state:paused]">
          {loop.map((a, i) => (
            <AthleteCard key={`${a.handle}-${i}`} a={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
