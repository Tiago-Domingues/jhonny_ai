"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import type { SurfResponse, BeachConditions } from "@/lib/beaches";
import { fetchSurfClient } from "@/lib/surf";

const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

function compass(deg: number | null): string {
  if (deg == null) return "–";
  return COMPASS[Math.round(deg / 22.5) % 16];
}

function fmt(v: number | null, digits = 1): string {
  return v == null ? "–" : v.toFixed(digits);
}

function BeachItem({ b, windLabel }: { b: BeachConditions; windLabel: string }) {
  return (
    <span className="flex items-center gap-3 whitespace-nowrap px-6">
      <a
        href={b.cam}
        target="_blank"
        rel="noopener noreferrer"
        title={`${b.name} — beachcam ao vivo`}
        className="group/cam inline-flex items-center gap-1 font-display text-sm font-bold uppercase tracking-wide text-white underline-offset-4 transition hover:text-emerald-300 hover:underline"
      >
        {b.name}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-emerald-400/70 transition group-hover/cam:text-emerald-300" aria-hidden>
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" />
        </svg>
      </a>
      <span className="text-sm font-medium text-white/90">
        {fmt(b.waveHeight)}m
      </span>
      <span className="text-xs text-white/50">·</span>
      <span className="text-sm text-white/70">{fmt(b.wavePeriod, 0)}s</span>
      {b.waveDirection != null && (
        <span
          className="inline-block text-white/60"
          style={{ transform: `rotate(${b.waveDirection + 180}deg)` }}
          aria-hidden
        >
          ↑
        </span>
      )}
      <span className="text-xs text-white/40">
        {windLabel} {fmt(b.windSpeed, 0)}kn {compass(b.windDirection)}
      </span>
      <span className="px-3 text-white/25">/</span>
    </span>
  );
}

export function SurfConditions() {
  const { t } = useLanguage();
  const [data, setData] = useState<SurfResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/surf");
        if (!res.ok) throw new Error("bad");
        const json = (await res.json()) as SurfResponse;
        if (active) {
          setData(json);
          setStatus("ok");
        }
      } catch {
        // Fallback: fetch Open-Meteo directly from the browser
        try {
          const json = await fetchSurfClient();
          if (active) {
            setData(json);
            setStatus("ok");
          }
        } catch {
          if (active) setStatus("error");
        }
      }
    };
    load();
    const id = setInterval(load, 30 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const updated = data
    ? new Date(data.updatedAt).toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex items-stretch overflow-hidden border-y border-line-dark bg-ink">
      <div className="z-10 hidden shrink-0 items-center gap-2 border-r border-line-dark bg-ink px-5 sm:flex">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white">
          {t.surf.label}
        </span>
        {updated && (
          <span className="text-[0.6rem] uppercase tracking-wide text-white/40">
            {t.surf.updated} {updated}
          </span>
        )}
      </div>

      <div className="relative flex-1 overflow-hidden py-3">
        {status === "loading" && (
          <span className="px-6 text-sm text-white/50">{t.surf.loading}</span>
        )}
        {status === "error" && (
          <span className="px-6 text-sm text-white/50">{t.surf.error}</span>
        )}
        {status === "ok" && data && (
          <div className="flex w-max animate-[marquee_45s_linear_infinite] items-center hover:[animation-play-state:paused]">
            {[...data.beaches, ...data.beaches].map((b, i) => (
              <BeachItem key={`${b.id}-${i}`} b={b} windLabel={t.surf.wind} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
