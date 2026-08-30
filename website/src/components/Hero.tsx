"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { HeroStoreScene } from "@/components/HeroStoreScene";
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
  const remainingRef = useRef(HERO_LOOP.videoMs);
  const startedAtRef = useRef(0);
  const [panel, setPanel] = useState<HeroPanel>("video");
  const [incoming, setIncoming] = useState<HeroPanel | null>(null);
  const [canLoop, setCanLoop] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setCanLoop(!prefersReducedMotion());
  }, []);

  useEffect(() => {
    remainingRef.current = panel === "video" ? HERO_LOOP.videoMs : HERO_LOOP.storeMs;
  }, [panel]);

  useEffect(() => {
    if (!canLoop || incoming || paused) return;
    startedAtRef.current = Date.now();
    const id = window.setTimeout(() => {
      setIncoming(panel === "video" ? "store" : "video");
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
    remainingRef.current = next === "video" ? HERO_LOOP.videoMs : HERO_LOOP.storeMs;
    setIncoming(next);
  }

  const shown: HeroPanel[] = incoming ? [panel, incoming] : [panel];

  function panelClass(name: HeroPanel) {
    if (incoming && name === incoming) return "hero-panel hero-panel--incoming hero-panel--active";
    if (incoming && name === panel) return "hero-panel hero-panel--under";
    if (!incoming && name === panel) return "hero-panel hero-panel--active";
    return "hero-panel";
  }

  return (
    <section
      id="top"
      data-hero-panel={incoming ?? panel}
      data-hero-loop={canLoop ? "on" : "off"}
      data-hero-paused={paused ? "true" : undefined}
      className={`relative flex min-h-[100svh] items-center overflow-hidden bg-paper ${
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
            preload="auto"
            poster="/brand/surf-hero-poster.jpg?v=wa-2026-08-23"
          >
            <source src="/brand/surf-hero.mp4?v=wa-2026-08-23" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-ink/10" />
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-ink/35 via-ink/10 to-transparent sm:w-2/3 lg:w-1/2" />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-36 sm:px-8">
            <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-white/90 sm:text-xs">
              {t.hero.eyebrow}
            </p>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.92] tracking-tight text-white text-balance drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-6xl lg:text-[5.25rem]">
              {t.hero.title1}
              <br />
              {t.hero.title2}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white sm:text-lg">
              {t.hero.subtitle}
            </p>
          </div>
        </div>
      )}

      {shown.includes("store") && (
        <div
          className={`${panelClass("store")} hero-panel--store flex`}
          aria-hidden={(incoming ?? panel) !== "store"}
        >
          <HeroStoreScene />
          <div className="hero-store-copy relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-end px-5 pb-24 pt-36 text-center sm:px-8">
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ink/55 sm:text-xs">
              {t.hero.eyebrow}
            </p>
            <h2 className="font-display text-3xl font-extrabold uppercase leading-[0.92] tracking-tight text-ink text-balance sm:text-5xl lg:text-6xl">
              {t.hero.title1}
              <br />
              {t.hero.title2}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/70 sm:text-base">
              {t.hero.subtitle}
            </p>
          </div>
        </div>
      )}

      <nav
        className={`absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 ${
          (incoming ?? panel) === "store" ? "text-ink" : "text-white"
        }`}
        aria-label={t.hero.loopLabel}
      >
        <PanelDot
          active={(incoming ?? panel) === "video"}
          label={t.hero.videoLabel}
          onClick={() => goTo("video")}
        />
        <PanelDot
          active={(incoming ?? panel) === "store"}
          label={t.hero.storeLabel}
          onClick={() => goTo("store")}
        />
      </nav>
    </section>
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
