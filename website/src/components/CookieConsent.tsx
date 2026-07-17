"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type ConsentState = {
  required: true;
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
};

const defaultConsent: ConsentState = {
  required: true,
  analytics: false,
  personalization: false,
  marketing: false,
};

const policyVersion = "2026-07-ecommerce-foundation";
const maxAge = 60 * 60 * 24 * 180;

const copy = {
  pt: {
    eyebrow: "Cookies e privacidade",
    title: "Surf limpo, dados protegidos",
    body:
      "Usamos cookies essenciais para carrinho, checkout e login. Analytics, personalização e lembretes de compra só ficam ativos com o teu consentimento.",
    required: "Essenciais sempre ativos",
    privacy: "Política de Privacidade",
    terms: "Termos",
    reject: "Só essenciais",
    customize: "Personalizar",
    save: "Guardar escolhas",
    accept: "Aceitar tudo",
    labels: {
      analytics: "Analytics",
      personalization: "Personalização",
      marketing: "Marketing",
    },
  },
  en: {
    eyebrow: "Cookies and privacy",
    title: "Clean surf, protected data",
    body:
      "We use essential cookies for cart, checkout and login. Analytics, personalization and purchase reminders only activate with your consent.",
    required: "Essential cookies always active",
    privacy: "Privacy Policy",
    terms: "Terms",
    reject: "Essentials only",
    customize: "Customize",
    save: "Save choices",
    accept: "Accept all",
    labels: {
      analytics: "Analytics",
      personalization: "Personalization",
      marketing: "Marketing",
    },
  },
} as const;

function hasConsentCookie() {
  return typeof document !== "undefined" && document.cookie.includes("jss_consent=");
}

export function CookieConsent({ initialVisible = true }: { initialVisible?: boolean }) {
  const { locale } = useLanguage();
  const text = copy[locale];
  // Show immediately on first paint when the server says there is no consent cookie.
  const [visible, setVisible] = useState(initialVisible);
  const [customizing, setCustomizing] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(defaultConsent);

  useEffect(() => {
    // Sync with the live browser cookie after paint (covers SSR / client mismatch).
    const id = window.setTimeout(() => {
      if (hasConsentCookie()) setVisible(false);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  async function save(next: ConsentState) {
    setConsent(next);
    document.cookie = `jss_consent=${encodeURIComponent(JSON.stringify({
      decisions: next,
      policyVersion,
    }))}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    setVisible(false);
    window.dispatchEvent(new Event("jss-consent-saved"));
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisions: next, source: "cookie_banner" }),
    }).catch(() => undefined);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-4xl rounded-3xl border border-line bg-white p-5 text-ink shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-muted">
            {text.eyebrow}
          </p>
          <h2 className="font-display mt-2 text-2xl font-extrabold uppercase tracking-tight">
            {text.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {text.body}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {text.required}.{" "}
            <a href="/privacidade" className="font-semibold text-ink underline underline-offset-4">
              {text.privacy}
            </a>{" "}
            ·{" "}
            <a href="/termos" className="font-semibold text-ink underline underline-offset-4">
              {text.terms}
            </a>
          </p>

          {customizing && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {(["analytics", "personalization", "marketing"] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border border-line bg-cream px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={consent[key]}
                    onChange={(event) => setConsent((cur) => ({ ...cur, [key]: event.target.checked }))}
                  />
                  <span>{text.labels[key]}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save(defaultConsent)}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition hover:text-ink"
          >
            {text.reject}
          </button>
          <button
            type="button"
            onClick={() => setCustomizing((value) => !value)}
            className="rounded-full border border-ink px-4 py-2 text-sm font-semibold transition hover:bg-cream"
          >
            {text.customize}
          </button>
          {customizing && (
            <button
              type="button"
              onClick={() => save(consent)}
              className="rounded-full border border-ink bg-cream px-4 py-2 text-sm font-bold text-ink transition hover:bg-cream-deep"
            >
              {text.save}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              save({ required: true, analytics: true, personalization: true, marketing: true })
            }
            className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-ink-soft"
          >
            {text.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
