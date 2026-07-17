"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { JssCommunity } from "@/components/JssCommunity";
import { BorderSurfer } from "@/components/BorderSurfer";

export function About() {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Don't autoplay (browsers block autoplay with sound). Just pause the
    // video with audio when it scrolls out of view.
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !el.paused) {
          el.pause();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="jss" className="relative scroll-mt-20 overflow-hidden bg-ink py-20 text-white sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden">
        {/* White sky / previous-section lip */}
        <div className="animate-ocean-border absolute -top-10 left-0 h-[4.5rem] w-[220%] text-paper">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0 0H1200V42C1110 18 1050 18 960 42S810 66 720 42S570 18 480 42S330 66 240 42S90 18 0 42V0Z"
              fill="currentColor"
            />
          </svg>
        </div>
        {/* Black wave edge against the white lip — no blue */}
        <div className="animate-ocean-border absolute top-5 left-0 h-14 w-[220%]">
          <svg viewBox="0 0 1200 56" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0 20C90 4 150 4 240 20S390 44 480 20S630 4 720 20S870 44 960 20S1110 4 1200 20V56H0Z"
              fill="#0d0d0d"
            />
            <path
              d="M0 24C90 10 150 10 240 24S390 42 480 24S630 10 720 24S870 42 960 24S1110 10 1200 24"
              fill="none"
              stroke="#0d0d0d"
              strokeWidth="3"
              opacity="0.9"
            />
          </svg>
        </div>
        {/* Jhonny rides the white / black edge */}
        <div className="animate-surf-border absolute top-[0.85rem] left-0">
          <BorderSurfer />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl border border-line-dark bg-black">
            <video
              ref={videoRef}
              className="aspect-[9/16] w-full bg-black object-contain"
              playsInline
              preload="metadata"
              controls
              muted={false}
              poster="/brand/jss-jhonny-poster.jpg"
            >
              <source src="/brand/jss-jhonny.mp4" type="video/mp4" />
            </video>
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
