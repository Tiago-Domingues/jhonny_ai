"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { storefrontText } from "@/lib/storefrontCopy";

export function VerifyEmailClient({ token }: { token: string }) {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).account;
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage(copy.verifyFailed);
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || data.error || copy.verifyFailed);
        }
        setOk(true);
        setMessage(copy.verifyOk);
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : copy.verifyFailed);
      });
  }, [token, copy.verifyFailed, copy.verifyOk]);

  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="font-display text-3xl font-extrabold uppercase">{copy.verifyTitle}</h2>
      {message && <p className="mt-4 rounded-xl bg-cream p-3 text-sm text-ink">{message}</p>}
      {ok && (
        <a href="/conta" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
          {copy.signIn}
        </a>
      )}
    </div>
  );
}
