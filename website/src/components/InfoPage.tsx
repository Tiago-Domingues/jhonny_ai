"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import { LEGAL, STORE } from "@/lib/i18n";

export type InfoSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type InfoContent = {
  title: string;
  intro?: string;
  sections: InfoSection[];
  updated?: string;
};

export function InfoPage({
  pt,
  en,
  zh,
}: {
  pt: InfoContent;
  en: InfoContent;
  zh?: InfoContent;
}) {
  const { locale } = useLanguage();
  const c = locale === "pt" ? pt : locale === "zh" ? zh || en : en;
  const back =
    locale === "pt" ? "Voltar ao site" : locale === "zh" ? "返回网站" : "Back to site";
  const legalTitle =
    locale === "pt"
      ? "Entidade responsável"
      : locale === "zh"
        ? "责任主体"
        : "Legal entity";

  return (
    <>
      <Header />
      <main className="flex-1 bg-paper pb-20 pt-28 sm:pt-36">
        <article className="mx-auto max-w-3xl px-5 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
          >
            <span aria-hidden>←</span> {back}
          </Link>

          <h1 className="font-display mt-6 text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
            {c.title}
          </h1>

          {c.updated && (
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
              {c.updated}
            </p>
          )}

          {c.intro && (
            <p className="mt-6 text-base leading-relaxed text-ink/80">{c.intro}</p>
          )}

          <div className="mt-8 space-y-8">
            {c.sections.map((s, i) => (
              <section key={i}>
                {s.heading && (
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide text-ink">
                    {s.heading}
                  </h2>
                )}
                {s.paragraphs?.map((p, j) => (
                  <p
                    key={j}
                    className="mt-3 text-[0.95rem] leading-relaxed text-ink/75"
                  >
                    {p}
                  </p>
                ))}
                {s.bullets && (
                  <ul className="mt-3 space-y-2 pl-1">
                    {s.bullets.map((b, j) => (
                      <li
                        key={j}
                        className="flex gap-2 text-[0.95rem] leading-relaxed text-ink/75"
                      >
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/40" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Legal entity block */}
          <div className="mt-12 rounded-2xl border border-line bg-cream p-6 text-sm text-ink/75">
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-muted">
              {legalTitle}
            </p>
            <p className="mt-3">
              {LEGAL.company} ({LEGAL.brand})
            </p>
            <p>NIF: {LEGAL.nif}</p>
            <p>{LEGAL.address}</p>
            <p className="mt-2">
              <a className="transition hover:text-ink" href={`mailto:${STORE.email}`}>
                {STORE.email}
              </a>{" "}
              ·{" "}
              <a className="transition hover:text-ink" href={`tel:+${STORE.phoneRaw}`}>
                {STORE.phoneDisplay}
              </a>
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
