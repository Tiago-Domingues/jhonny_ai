"use client";

import { useEffect, useState } from "react";

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

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(defaultConsent);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setVisible(!document.cookie.includes("jss_consent="));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  async function save(next: ConsentState) {
    setConsent(next);
    setVisible(false);
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisions: next, source: "cookie_banner" }),
    }).catch(() => undefined);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-4xl rounded-3xl border border-line bg-white p-5 text-ink shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-muted">
            Cookies e privacidade
          </p>
          <h2 className="font-display mt-2 text-2xl font-extrabold uppercase tracking-tight">
            Surf limpo, dados protegidos
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Usamos cookies essenciais para carrinho e login. Analytics, personalização e lembretes de compra só ficam ativos com o teu consentimento.
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
                  <span className="capitalize">{key}</span>
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
            Rejeitar
          </button>
          <button
            type="button"
            onClick={() => setCustomizing((value) => !value)}
            className="rounded-full border border-ink px-4 py-2 text-sm font-semibold transition hover:bg-cream"
          >
            Personalizar
          </button>
          <button
            type="button"
            onClick={() =>
              save({ required: true, analytics: true, personalization: true, marketing: true })
            }
            className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-ink-soft"
          >
            Aceitar tudo
          </button>
        </div>
      </div>
    </div>
  );
}
