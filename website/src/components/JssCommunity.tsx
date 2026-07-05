"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useLanguage } from "@/components/LanguageProvider";
import { STORE } from "@/lib/i18n";
import { ArrowIcon, MailIcon } from "@/components/icons";

// To enable live Google reviews, create a free widget at elfsight.com
// (Google Reviews) and paste its app id below, e.g. "elfsight-app-xxxxxxxx".
const ELFSIGHT_APP_ID = "";

// To deliver newsletter sign-ups, paste your Mailchimp embedded-form action URL
// (Audience -> Signup forms -> Embedded form). Leave empty to capture-only.
const MAILCHIMP_ACTION = "";

const GOOGLE_REVIEWS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  STORE.mapsQuery
)}`;

function Reviews() {
  const { t } = useLanguage();

  if (ELFSIGHT_APP_ID) {
    return (
      <div className="rounded-2xl border border-line-dark bg-ink-soft p-6">
        <Script src="https://static.elfsight.com/platform/platform.js" strategy="lazyOnload" />
        <div className={`${ELFSIGHT_APP_ID} elfsight-app`} data-elfsight-app-lazy />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-5 rounded-2xl border border-line-dark bg-ink-soft p-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl tracking-tight text-amber-400">★★★★★</span>
          <span className="font-display text-2xl font-extrabold text-white">5.0</span>
        </div>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.15em] text-white/50">
          {t.reviews.title}
        </p>
        <p className="mt-1 text-base text-white/75">{t.reviews.summary}</p>
      </div>
      <a
        href={GOOGLE_REVIEWS_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 self-start rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white hover:text-ink"
      >
        {t.reviews.cta}
        <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>
    </div>
  );
}

function Newsletter() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  // Hydration-safe: only enable the form after mount.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (MAILCHIMP_ACTION) return; // let the browser post to Mailchimp
    e.preventDefault();
    if (!email) return;
    setDone(true);
  };

  return (
    <div className="flex flex-col justify-between gap-5 rounded-2xl border border-line-dark bg-ink-soft p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 text-white">
          <MailIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-bold uppercase tracking-wide text-white">
            {t.newsletter.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/70">
            {t.newsletter.desc}
          </p>
        </div>
      </div>

      {done ? (
        <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300">
          {t.newsletter.success}
        </p>
      ) : (
        <form
          action={MAILCHIMP_ACTION || undefined}
          method="post"
          target={MAILCHIMP_ACTION ? "_blank" : undefined}
          onSubmit={onSubmit}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="email"
            name="EMAIL"
            required
            disabled={!ready}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.newsletter.placeholder}
            className="min-w-0 flex-1 rounded-full border border-white/25 bg-ink px-5 py-3 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink transition hover:bg-cream"
          >
            {t.newsletter.button}
          </button>
        </form>
      )}
    </div>
  );
}

export function JssCommunity() {
  return (
    <div className="mx-auto mt-16 grid max-w-7xl gap-5 px-5 sm:px-8 md:grid-cols-2">
      <Reviews />
      <Newsletter />
    </div>
  );
}
