"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { STORE, NAV_LINKS } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import {
  InstagramIcon,
  WhatsappIcon,
  FacebookIcon,
  MailIcon,
} from "@/components/icons";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const socials = [
    { icon: WhatsappIcon, href: `https://wa.me/${STORE.phoneRaw}`, label: "WhatsApp" },
    { icon: InstagramIcon, href: STORE.instagram, label: "Instagram" },
    { icon: FacebookIcon, href: STORE.facebook, label: "Facebook" },
    { icon: MailIcon, href: `mailto:${STORE.email}`, label: "Email" },
  ];

  const storeLinks = [
    { label: t.nav.jss, href: "#jss" },
    { label: t.footer.services, href: "#services" },
    { label: t.footer.visit, href: "#visit" },
    { label: t.nav.contact, href: "#contact" },
  ];

  const supportLinks = [
    { label: t.footer.repairs, href: "https://www.instagram.com/fibercrw/", ext: true },
    { label: t.footer.buyback, href: "#services" },
    { label: t.footer.erasmus, href: "https://www.erasmuslifelisboa.com/", ext: true },
  ];

  return (
    <footer className="border-t border-line-dark bg-ink py-14 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 border-b border-line-dark pb-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + socials */}
          <div className="flex flex-col items-start gap-4">
            <Logo type="stacked" variant="dark" className="h-16" />
            <p className="text-sm text-white/60">{t.footer.tagline}</p>
            <div className="mt-1 flex items-center gap-3">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/40">
              {t.footer.shopTitle}
            </p>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {t.nav[l.key]}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* The Store */}
          <div>
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/40">
              {t.footer.storeTitle}
            </p>
            <ul className="space-y-2.5">
              {storeLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support + contact */}
          <div>
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/40">
              {t.footer.supportTitle}
            </p>
            <ul className="space-y-2.5">
              {supportLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target={l.ext ? "_blank" : undefined}
                    rel={l.ext ? "noopener noreferrer" : undefined}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-1 text-sm text-white/55">
              <p>{STORE.address}</p>
              <a href={`tel:+${STORE.phoneRaw}`} className="block transition hover:text-white">
                {STORE.phoneDisplay}
              </a>
              <a href={`mailto:${STORE.email}`} className="block transition hover:text-white">
                {STORE.email}
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 pt-6 text-center text-xs text-white/40 sm:flex-row sm:text-left">
          <p>
            © {year} {STORE.name}. {t.footer.rights}
          </p>
          <p>{t.footer.madeWith}</p>
        </div>
      </div>
    </footer>
  );
}
