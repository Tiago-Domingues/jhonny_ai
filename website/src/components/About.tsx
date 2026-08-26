"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { JssCommunity } from "@/components/JssCommunity";

function playLabel(locale: string) {
  if (locale === "pt") return "Reproduzir com som";
  if (locale === "zh") return "播放（有声）";
  return "Play with sound";
}

export function About() {
  const { t, locale } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPlay, setShowPlay] = useState(true);

  function enableSound(el: HTMLVideoElement) {
    el.defaultMuted = false;
    el.muted = false;
    if (el.volume === 0) el.volume = 1;
  }

  function playWithSound() {
    const el = videoRef.current;
    if (!el) return;
    enableSound(el);
    void el.play().then(() => setShowPlay(false));
  }

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    enableSound(el);

    const onPlay = () => {
      enableSound(el);
      setShowPlay(false);
    };

    // Don't autoplay (browsers block autoplay with sound). Pause when it
    // scrolls out of view; leave mute state as the viewer left it.
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !el.paused) {
          el.pause();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    el.addEventListener("play", onPlay);
    el.addEventListener("playing", onPlay);
    return () => {
      obs.disconnect();
      el.removeEventListener("play", onPlay);
      el.removeEventListener("playing", onPlay);
    };
  }, []);

  return (
    <section id="jss" className="scroll-mt-20 bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <div className="relative mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl border border-line-dark bg-black">
            <video
              ref={videoRef}
              className="aspect-[9/16] w-full bg-black object-contain"
              playsInline
              preload="metadata"
              controls
              poster="/brand/jss-jhonny-poster.jpg"
            >
              <source src="/brand/jss-jhonny.mp4" type="video/mp4" />
            </video>
            {showPlay && (
              <button
                type="button"
                data-testid="family-video-play"
                onClick={playWithSound}
                aria-label={playLabel(locale)}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 transition hover:bg-black/45"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink shadow-lg">
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-7 w-7 fill-current" aria-hidden>
                    <path d="M8 5.14v13.72L19 12 8 5.14z" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            {t.jss.eyebrow}
          </p>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-balance sm:text-5xl">
            {t.jss.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/75">
            {t.jss.p1}
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/75">
            {t.jss.p2}
          </p>
        </div>
      </div>

      <JssCommunity />
    </section>
  );
}
