"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { HERO_LOOP, type HeroPanel } from "@/lib/heroLoop";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("jss-a11y-motion")
  );
}

export function Hero() {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const remainingRef = useRef<number>(HERO_LOOP.videoMs);
  const startedAtRef = useRef(0);
  const [panel, setPanel] = useState<HeroPanel>("video");
  const [incoming, setIncoming] = useState<HeroPanel | null>(null);
  const [canLoop, setCanLoop] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setCanLoop(!prefersReducedMotion());
  }, []);

  useEffect(() => {
    remainingRef.current = panel === "video" ? HERO_LOOP.videoMs : HERO_LOOP.inkMs;
  }, [panel]);

  useEffect(() => {
    if (!canLoop || incoming || paused) return;
    startedAtRef.current = Date.now();
    const id = window.setTimeout(() => {
      setIncoming(panel === "video" ? "ink" : "video");
    }, remainingRef.current);
    return () => {
      window.clearTimeout(id);
      remainingRef.current = Math.max(
        400,
        remainingRef.current - (Date.now() - startedAtRef.current)
      );
    };
  }, [panel, canLoop, incoming, paused]);

  useEffect(() => {
    if (!incoming) return;
    const id = window.setTimeout(() => {
      setPanel(incoming);
      setIncoming(null);
    }, HERO_LOOP.fadeMs);
    return () => window.clearTimeout(id);
  }, [incoming]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const showVideo = panel === "video" || incoming === "video";
    if (showVideo) {
      void video.play().catch(() => undefined);
      return;
    }
    const id = window.setTimeout(() => video.pause(), HERO_LOOP.fadeMs);
    return () => window.clearTimeout(id);
  }, [panel, incoming]);

  function goTo(next: HeroPanel) {
    if (next === panel || incoming) return;
    remainingRef.current = next === "video" ? HERO_LOOP.videoMs : HERO_LOOP.inkMs;
    setIncoming(next);
  }

  const shown: HeroPanel[] = incoming ? [panel, incoming] : [panel];

  function panelClass(name: HeroPanel) {
    if (incoming && name === incoming) return "hero-panel hero-panel--incoming hero-panel--active";
    if (incoming && name === panel) return "hero-panel hero-panel--under";
    if (!incoming && name === panel) return "hero-panel hero-panel--active";
    return "hero-panel";
  }

  const copy = <HeroCopy eyebrow={t.hero.eyebrow} title1={t.hero.title1} title2={t.hero.title2} subtitle={t.hero.subtitle} />;

  return (
    <section
      id="top"
      data-hero-panel={incoming ?? panel}
      data-hero-loop={canLoop ? "on" : "off"}
      data-hero-paused={paused ? "true" : undefined}
      className={`relative flex min-h-[100svh] items-center overflow-hidden bg-ink ${
        paused ? "hero-loop-paused" : ""
      }`}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setPaused(true);
      }}
      onPointerLeave={() => setPaused(false)}
    >
      {shown.includes("video") && (
        <div
          className={panelClass("video")}
          aria-hidden={(incoming ?? panel) !== "video"}
        >
          <video
            ref={videoRef}
            className="media-vivid absolute inset-0 h-full w-full object-cover object-center"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/brand/surf-hero-poster.jpg?v=wa-2026-08-23"
          >
            <source src="/brand/surf-hero.mp4?v=wa-2026-08-23" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-ink/10" />
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-ink/35 via-ink/10 to-transparent sm:w-2/3 lg:w-1/2" />
          {copy}
        </div>
      )}

      {shown.includes("ink") && (
        <div
          className={`${panelClass("ink")} hero-panel--ink`}
          aria-hidden={(incoming ?? panel) !== "ink"}
        >
          {copy}
        </div>
      )}

      <nav
        className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 text-white"
        aria-label={t.hero.loopLabel}
      >
        <PanelDot
          active={(incoming ?? panel) === "video"}
          label={t.hero.videoLabel}
          onClick={() => goTo("video")}
        />
        <PanelDot
          active={(incoming ?? panel) === "ink"}
          label={t.hero.inkLabel}
          onClick={() => goTo("ink")}
        />
      </nav>
    </section>
  );
}

function HeroCopy({
  eyebrow,
  title1,
  title2,
  subtitle,
}: {
  eyebrow: string;
  title1: string;
  title2: string;
  subtitle: string;
}) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-36 sm:px-8">
      <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-white/90 sm:text-xs">
        {eyebrow}
      </p>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.92] tracking-tight text-white text-balance drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-6xl lg:text-[5.25rem]">
        {title1}
        <br />
        {title2}
      </h1>
      <p className="mt-7 max-w-xl text-base leading-relaxed text-white sm:text-lg">
        {subtitle}
      </p>
    </div>
  );
}

function PanelDot({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className={`h-1.5 rounded-full bg-current transition-all ${
        active ? "w-8" : "w-3 opacity-40 hover:opacity-70"
      }`}
    />
  );
}
