"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { storefrontText } from "@/lib/storefrontCopy";

export function VerifyEmailClient({ token }: { token: string }) {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).account;
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  async function confirm() {
    if (!token || busy || ok) return;
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || copy.verifyFailed);
      }
      setOk(true);
      setMessage(copy.verifyOk);
      window.location.assign(typeof data.redirect === "string" ? data.redirect : "/conta");
    } catch (error) {
      setBusy(false);
      setMessage(error instanceof Error ? error.message : copy.verifyFailed);
    }
  }

  useEffect(() => {
    if (!token) {
      setMessage(copy.verifyFailed);
      return;
    }
    if (started.current) return;
    started.current = true;
    void confirm();
    // Confirm once per token. Locale copy must not retrigger the POST.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="font-display text-3xl font-extrabold uppercase">{copy.verifyTitle}</h2>
      {message && <p className="mt-4 rounded-xl bg-cream p-3 text-sm text-ink">{message}</p>}
      {ok && (
        <a href="/conta" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
          {copy.verifyOk}
        </a>
      )}
      {!ok && token && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
          className="mt-4 inline-block rounded-2xl bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {copy.verifyTitle}
        </button>
      )}
    </div>
  );
}
