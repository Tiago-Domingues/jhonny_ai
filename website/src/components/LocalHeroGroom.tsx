"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { ATHLETES, type Athlete } from "@/lib/athletes";
import { InstagramIcon } from "@/components/icons";

function GroomCard({ a }: { a: Athlete }) {
  const [photoSrc, setPhotoSrc] = useState(a.photo);

  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative mx-3 block aspect-[3/4] w-56 shrink-0 overflow-hidden rounded-2xl border border-line bg-white shadow-md transition duration-300 hover:-translate-y-1.5 hover:border-ink/30 hover:shadow-xl sm:w-60"
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

      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />

      <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-ink group-hover:text-white">
        <InstagramIcon className="h-4 w-4" />
      </span>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-display text-xl font-extrabold uppercase leading-tight tracking-wide text-white drop-shadow">
          {a.name}
        </p>
        <p className="mt-1 text-sm text-white/80">{a.bio}</p>
        <p className="mt-2 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white">
          Local Hero Groom
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/60 transition group-hover:text-white">
          @{a.handle}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </p>
      </div>
    </a>
  );
}

export function LocalHeroGroom() {
  const { t } = useLanguage();
  const loop = [...ATHLETES, ...ATHLETES];

  return (
    <section
      id="local-hero-groom"
      className="scroll-mt-20 overflow-hidden bg-paper py-20 text-ink sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            {t.localHeroGroom.eyebrow}
          </p>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-balance sm:text-5xl">
            {t.localHeroGroom.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            {t.localHeroGroom.subtitle}
          </p>
        </div>
      </div>

      <div className="group relative mt-12 flex overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-paper to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-paper to-transparent sm:w-24" />
        <div className="flex w-max animate-[marquee-reverse_55s_linear_infinite] items-stretch group-hover:[animation-play-state:paused]">
          {loop.map((a, i) => (
            <GroomCard key={`groom-${a.handle}-${i}`} a={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
