"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { STORE } from "@/lib/i18n";
import { PinIcon, ClockIcon, ArrowIcon } from "@/components/icons";

export function Visit() {
  const { t } = useLanguage();
  const coords = `${STORE.lat},${STORE.lon}`;
  const mapsEmbed = `https://www.google.com/maps?q=${coords}&z=17&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${coords}`;

  return (
    <section id="visit" className="scroll-mt-20 bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
              {t.visit.eyebrow}
            </p>
            <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-ink text-balance sm:text-5xl">
              {t.visit.title}
            </h2>

            <div className="mt-8 space-y-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink text-ink">
                  <PinIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                    {t.visit.addressLabel}
                  </p>
                  <p className="mt-1 text-lg font-medium text-ink">
                    {STORE.address}
                  </p>
                  <p className="text-sm text-muted">{STORE.region}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {STORE.lat}, {STORE.lon}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink text-ink">
                  <ClockIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                    {t.visit.hoursLabel}
                  </p>
                  <div className="mt-1 space-y-1">
                    {t.visit.hours.map((h) => (
                      <div
                        key={h.days}
                        className="flex items-center gap-3 text-ink"
                      >
                        <span className="font-medium">{h.days}</span>
                        <span className="text-muted">·</span>
                        <span className="text-muted">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-ink-soft"
            >
              {t.visit.directions}
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line">
            <iframe
              title="Jhonny Surf Store map"
              src={mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[340px] w-full"
            />
          </div>
        </div>

        <div className="mt-12">
          <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
            {t.visit.tourLabel}
          </p>
          <div className="overflow-hidden rounded-2xl border border-line">
            <iframe
              title="Jhonny Surf Store - visita virtual"
              src="https://my.matterport.com/show/?m=FqiGzxJt1bU&play=1"
              loading="lazy"
              allow="fullscreen; xr-spatial-tracking"
              allowFullScreen
              className="h-[220px] w-full sm:h-[280px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
