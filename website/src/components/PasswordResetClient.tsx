"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { storefrontText } from "@/lib/storefrontCopy";

export function ForgotPasswordClient() {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).account;
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email") || "") }),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);
    setMessage(data.message || copy.ready);
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="font-display text-3xl font-extrabold uppercase">{copy.forgotPassword}</h2>
      <p className="mt-3 text-sm text-muted">{copy.joinIntro}</p>
      <input name="email" required type="email" placeholder="Email" className="mt-6 w-full rounded-2xl border border-line px-4 py-3" />
      <button disabled={submitting} className="mt-4 w-full rounded-2xl bg-ink px-5 py-4 font-bold uppercase tracking-wide text-white">
        {submitting ? copy.saving : copy.forgotPassword}
      </button>
      {message && <p className="mt-4 rounded-xl bg-cream p-3 text-sm text-ink">{message}</p>}
      <a href="/conta" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
        {copy.signIn}
      </a>
    </form>
  );
}

export function InvalidResetLink() {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).account;
  return (
    <p className="rounded-3xl border border-line bg-white p-6 text-sm text-muted">{copy.invalidResetLink}</p>
  );
}

export function ResetPasswordClient({ token }: { token: string }) {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).account;
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: String(form.get("password") || "") }),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) {
      setMessage(data.message || data.error || copy.submitFailed);
      return;
    }
    setOk(true);
    setMessage(copy.ready);
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="font-display text-3xl font-extrabold uppercase">{copy.password}</h2>
      <input
        name="password"
        required
        minLength={8}
        type="password"
        placeholder={copy.password}
        className="mt-6 w-full rounded-2xl border border-line px-4 py-3"
      />
      <button disabled={submitting || ok} className="mt-4 w-full rounded-2xl bg-ink px-5 py-4 font-bold uppercase tracking-wide text-white">
        {submitting ? copy.saving : copy.save}
      </button>
      {message && <p className="mt-4 rounded-xl bg-cream p-3 text-sm text-ink">{message}</p>}
      {ok && (
        <a href="/conta" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
          {copy.signIn}
        </a>
      )}
    </form>
  );
}
