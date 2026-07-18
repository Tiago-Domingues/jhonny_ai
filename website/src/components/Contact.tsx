"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { STORE, whatsappHref } from "@/lib/i18n";
import {
  WhatsappIcon,
  MailIcon,
  InstagramIcon,
  FacebookIcon,
  ArrowIcon,
} from "@/components/icons";

export function Contact() {
  const { t } = useLanguage();

  const cards = [
    {
      icon: WhatsappIcon,
      label: t.contact.whatsapp,
      value: STORE.phoneDisplay,
      href: whatsappHref(),
    },
    {
      icon: MailIcon,
      label: t.contact.email,
      value: STORE.email,
      href: `mailto:${STORE.email}`,
    },
    {
      icon: InstagramIcon,
      label: t.contact.follow,
      value: "@jhonnysurfstore",
      href: STORE.instagram,
    },
    {
      icon: FacebookIcon,
      label: "Facebook",
      value: "Jhonny Surf Store",
      href: STORE.facebook,
    },
  ];

  return (
    <section id="contact" className="scroll-mt-20 bg-paper py-20 text-ink sm:py-28">
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          {t.contact.eyebrow}
        </p>
        <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-balance sm:text-6xl">
          {t.contact.title}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
          {t.contact.subtitle}
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-ink/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink transition group-hover:bg-ink group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                    {c.label}
                  </p>
                  <p className="mt-0.5 truncate text-base font-medium text-ink">
                    {c.value}
                  </p>
                </div>
                <ArrowIcon className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-ink" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
