"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import {
  calculateRecommendedVolume,
  surfboardsShopHref,
  type SurfFrequency,
  type SurfLevel,
  type WaveQuality,
} from "@/lib/ecommerce/volumeCalculator";
import { volumeCalculatorCopy } from "@/lib/volumeCalculatorCopy";

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function OptionGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  name: string;
  value: T | "";
  onChange: (value: T) => void;
  options: Array<{ value: T; title: string; description: string }>;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="font-display text-sm font-bold uppercase tracking-[0.16em] text-ink">
        {legend}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-2xl border px-4 py-3 transition ${
                selected
                  ? "border-ink bg-ink text-white shadow-sm"
                  : "border-line bg-white text-ink hover:border-ink/40"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="block text-sm font-bold uppercase tracking-[0.08em]">
                {option.title}
              </span>
              <span
                className={`mt-1 block text-xs ${selected ? "text-white/80" : "text-muted"}`}
              >
                {option.description}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function VolumeCalculatorClient() {
  const { locale } = useLanguage();
  const copy = volumeCalculatorCopy(locale);

  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [level, setLevel] = useState<SurfLevel | "">("");
  const [frequency, setFrequency] = useState<SurfFrequency | "">("");
  const [waveQuality, setWaveQuality] = useState<WaveQuality | "">("");

  useEffect(() => {
    document.title = `${copy.pageTitle} · Jhonny Surf Store`;
  }, [copy.pageTitle]);

  const volumeLiters = useMemo(
    () =>
      calculateRecommendedVolume({
        weightKg: parseNumber(weightKg),
        ageYears: parseNumber(ageYears),
        level,
        frequency,
        waveQuality,
      }),
    [ageYears, frequency, level, waveQuality, weightKg]
  );

  const shopHref = surfboardsShopHref(volumeLiters);

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <Link
        href="/loja?categoryGroup=surfboards"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <span aria-hidden>←</span> {copy.backLabel}
      </Link>

      <h1 className="font-display mt-6 text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
        {copy.pageTitle}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink/75">{copy.pageIntro}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
      <div className="space-y-8">
        <section className="rounded-3xl border border-line bg-cream/60 p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-ink">
            {copy.formulaTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">{copy.formulaText}</p>
          <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-muted">
            {copy.explainTitle}
          </h3>
          <ul className="mt-3 space-y-2">
            {copy.explainBullets.map((bullet) => (
              <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-ink/75">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/40" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm font-medium text-ink/80">{copy.tip}</p>
        </section>

        <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
          <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-ink">
              {copy.surferData}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  {copy.heightLabel}
                </span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={heightCm}
                  onChange={(event) => setHeightCm(event.target.value)}
                  className="rounded-2xl border border-line px-4 py-3 text-ink outline-none transition focus:border-ink"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  {copy.weightLabel}
                </span>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  required
                  value={weightKg}
                  onChange={(event) => setWeightKg(event.target.value)}
                  className="rounded-2xl border border-line px-4 py-3 text-ink outline-none transition focus:border-ink"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  {copy.ageLabel}
                </span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={ageYears}
                  onChange={(event) => setAgeYears(event.target.value)}
                  className="rounded-2xl border border-line px-4 py-3 text-ink outline-none transition focus:border-ink"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
            <OptionGroup
              legend={copy.surfLevel}
              name="surf-level"
              value={level}
              onChange={setLevel}
              options={copy.levels}
            />
          </section>

          <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
            <OptionGroup
              legend={copy.surfFrequency}
              name="surf-frequency"
              value={frequency}
              onChange={setFrequency}
              options={copy.frequencies}
            />
          </section>

          <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
            <OptionGroup
              legend={copy.waveType}
              name="wave-quality"
              value={waveQuality}
              onChange={setWaveQuality}
              options={copy.waves}
            />
          </section>
        </form>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-3xl border border-line bg-ink p-6 text-white shadow-lg sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
            {copy.recommendedVolume}
          </p>
          <p
            className="font-display mt-3 text-5xl font-extrabold tracking-tight"
            aria-live="polite"
          >
            {volumeLiters != null ? `${volumeLiters.toFixed(2)}L` : copy.noResult}
          </p>
          {volumeLiters != null && (
            <Link
              href={shopHref}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-cream"
            >
              {copy.seeBoards}
            </Link>
          )}
        </div>
      </aside>
      </div>
    </div>
  );
}
