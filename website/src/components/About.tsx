"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { JssCommunity } from "@/components/JssCommunity";

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
    <section id="jss" className="relative scroll-mt-20 overflow-hidden bg-paper py-20 text-ink sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl border border-line bg-ink">
            <video
              ref={videoRef}
              className="aspect-[9/16] w-full bg-ink object-contain"
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            {t.jss.eyebrow}
          </p>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-balance sm:text-5xl">
            {t.jss.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">
            {t.jss.p1}
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted">
            {t.jss.p2}
          </p>
        </div>
      </div>

      <JssCommunity />
    </section>
  );
}
