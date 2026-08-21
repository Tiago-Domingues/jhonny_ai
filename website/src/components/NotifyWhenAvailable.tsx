"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { storefrontText } from "@/lib/storefrontCopy";

export function NotifyWhenAvailable({
  productId,
  productName,
  variant = "detail",
  onResult,
}: {
  productId: string;
  productName: string;
  variant?: "detail" | "card";
  onResult?: (ok: boolean) => void;
}) {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).product;
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function askWhenAvailable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    const response = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        email: form.get("email"),
        name: form.get("name"),
        phoneCountryCode: form.get("phoneCountryCode"),
        phone: form.get("phone"),
        message: `Notify me when ${productName} is available.`,
      }),
    });
    setSubmitting(false);
    onResult?.(response.ok);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "card"
            ? "w-full rounded-full bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-ink-soft"
            : "w-full rounded-full bg-ink px-6 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-ink-soft sm:w-auto"
        }
      >
        {copy.notify}
      </button>
    );
  }

  return (
    <form
      onSubmit={askWhenAvailable}
      className={
        variant === "card"
          ? "grid gap-2 rounded-2xl bg-cream p-3"
          : "grid max-w-xl gap-3 rounded-3xl bg-white p-5"
      }
    >
      <input
        name="email"
        required
        type="email"
        placeholder={copy.email}
        className={
          variant === "card"
            ? "rounded-xl border border-line px-3 py-2 text-sm"
            : "rounded-2xl border border-line px-4 py-3"
        }
      />
      <div className={variant === "card" ? "grid gap-2" : "grid gap-3 sm:grid-cols-2"}>
        <input
          name="name"
          placeholder={copy.name}
          className={
            variant === "card"
              ? "rounded-xl border border-line px-3 py-2 text-sm"
              : "rounded-2xl border border-line px-4 py-3"
          }
        />
        <div className={variant === "card" ? "grid grid-cols-[0.5fr_1fr] gap-2" : "grid grid-cols-[0.45fr_1fr] gap-2"}>
          <select
            name="phoneCountryCode"
            defaultValue="+351"
            className={
              variant === "card"
                ? "rounded-xl border border-line px-2 py-2 text-sm"
                : "rounded-2xl border border-line px-4 py-3"
            }
          >
            <option value="+351">+351</option>
            <option value="+34">+34</option>
            <option value="+33">+33</option>
            <option value="+44">+44</option>
            <option value="+49">+49</option>
            <option value="+1">+1</option>
          </select>
          <input
            name="phone"
            placeholder={copy.phone}
            className={
              variant === "card"
                ? "rounded-xl border border-line px-3 py-2 text-sm"
                : "rounded-2xl border border-line px-4 py-3"
            }
          />
        </div>
      </div>
      <button
        disabled={submitting}
        className={
          variant === "card"
            ? "rounded-full bg-ink px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wide text-white disabled:opacity-60"
            : "rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
        }
      >
        {copy.notifyCta}
      </button>
    </form>
  );
}
