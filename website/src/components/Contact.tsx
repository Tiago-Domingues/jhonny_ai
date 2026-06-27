"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { STORE } from "@/lib/i18n";
import {
  WhatsappIcon,
  PhoneIcon,
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
      href: `https://wa.me/${STORE.phoneRaw}`,
    },
    {
      icon: PhoneIcon,
      label: t.contact.call,
      value: STORE.phoneDisplay,
      href: `tel:+${STORE.phoneRaw}`,
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
    <section id="contact" className="scroll-mt-20 bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
          {t.contact.eyebrow}
        </p>
        <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-balance sm:text-6xl">
          {t.contact.title}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70">
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
                className="group flex items-center gap-4 rounded-2xl border border-line-dark bg-ink-soft p-6 text-left transition hover:-translate-y-0.5 hover:border-white/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition group-hover:bg-white group-hover:text-ink">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/50">
                    {c.label}
                  </p>
                  <p className="mt-0.5 truncate text-base font-medium text-white">
                    {c.value}
                  </p>
                </div>
                <ArrowIcon className="h-4 w-4 shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-white" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
