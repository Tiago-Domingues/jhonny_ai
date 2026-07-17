"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { STORE, whatsappHref } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import {
  InstagramIcon,
  WhatsappIcon,
  FacebookIcon,
  MailIcon,
} from "@/components/icons";
import { PaymentBadges } from "@/components/PaymentIcons";

type FLink = { label: string; href: string; ext?: boolean };

function FooterColumn({ title, links }: { title: string; links: FLink[] }) {
  return (
    <div>
      <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/40">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((l) => (
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
    </div>
  );
}

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const socials = [
    { icon: WhatsappIcon, href: whatsappHref(), label: "WhatsApp" },
    { icon: InstagramIcon, href: STORE.instagram, label: "Instagram" },
    { icon: FacebookIcon, href: STORE.facebook, label: "Facebook" },
    { icon: MailIcon, href: `mailto:${STORE.email}`, label: "Email" },
  ];

  const info: FLink[] = [
    { label: t.footer.terms, href: "/termos" },
    { label: t.footer.privacy, href: "/privacidade" },
    { label: t.footer.returns, href: "/trocas-e-devolucoes" },
    { label: t.footer.complaints, href: "https://www.livroreclamacoes.pt/inicio", ext: true },
    { label: t.footer.disputes, href: "https://www.consumidor.gov.pt/", ext: true },
    { label: t.footer.fraud, href: "/reportar-fraude" },
  ];

  const store: FLink[] = [
    { label: t.footer.shopTitle, href: "/loja" },
    { label: t.footer.about, href: "/#jss" },
    { label: t.footer.services, href: "/#services" },
    { label: t.footer.visit, href: "/#visit" },
    { label: t.nav.contact, href: "/#contact" },
    { label: t.footer.erasmus, href: "/erasmus" },
  ];

  const support: FLink[] = [
    { label: t.footer.faq, href: "/faq" },
    { label: t.footer.repairs, href: "https://www.instagram.com/fibercrw/", ext: true },
    { label: t.footer.warranty, href: "/garantia" },
    { label: t.footer.buyback, href: "/#services" },
    { label: t.footer.payments, href: "/pagamentos-e-envios" },
  ];

  return (
    <footer className="border-t border-line-dark bg-ink py-14 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 border-b border-line-dark pb-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + socials */}
          <div className="flex flex-col items-start gap-4">
            <Logo type="stacked" className="h-16 rounded-xl" />
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

          <FooterColumn title={t.footer.infoTitle} links={info} />
          <FooterColumn title={t.footer.storeTitle} links={store} />

          <div>
            <FooterColumn title={t.footer.supportTitle} links={support} />
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

        {/* Payments */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-line-dark py-6 sm:flex-row">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/40">
            {t.footer.payments}
          </p>
          <PaymentBadges />
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
