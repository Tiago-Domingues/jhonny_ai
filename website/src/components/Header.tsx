"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Logo } from "@/components/Logo";
import { NAV_LINKS } from "@/lib/i18n";
import { CartIcon, UserIcon, FlagPT, FlagEN } from "@/components/icons";

type Panel = "cart" | "account" | null;

export function Header() {
  const { t, locale, toggle } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!panel) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPanel(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [panel]);

  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line-dark bg-ink/95 backdrop-blur-md"
          : "bg-gradient-to-b from-black/60 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <a href="#top" aria-label="Jhonny Surf Store" className="shrink-0">
          <Logo type="horizontal" variant="dark" priority className="h-9 sm:h-10" />
        </a>

        <nav className="hidden items-center gap-7 xl:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-white/85 transition hover:text-white"
            >
              {t.nav[l.key]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language toggle with flags */}
          <button
            onClick={toggle}
            aria-label="Toggle language"
            className="flex items-center gap-1.5 rounded-full border border-white/30 px-2.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-white transition hover:border-white"
          >
            {locale === "pt" ? (
              <FlagPT className="h-3.5 w-5 rounded-[2px]" />
            ) : (
              <FlagEN className="h-3.5 w-5 rounded-[2px]" />
            )}
            <span>{locale === "pt" ? "PT" : "EN"}</span>
          </button>

          <div ref={menuRef} className="flex items-center gap-2 sm:gap-3">
          {/* Account (placeholder) */}
          <div className="relative">
            <button
              onClick={() => togglePanel("account")}
              aria-label={t.account.title}
              aria-expanded={panel === "account"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-white"
            >
              <UserIcon className="h-5 w-5" />
            </button>
            {panel === "account" && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-paper p-2 text-ink shadow-xl">
                <p className="px-3 pb-2 pt-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  {t.account.title}
                </p>
                {[t.account.signIn, t.account.register, t.account.orders].map((label) => (
                  <button
                    key={label}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                  >
                    {label}
                  </button>
                ))}
                <p className="px-3 pb-1 pt-2 text-[0.65rem] uppercase tracking-wide text-muted">
                  {t.account.soon}
                </p>
              </div>
            )}
          </div>

          {/* Cart (placeholder) */}
          <div className="relative">
            <button
              onClick={() => togglePanel("cart")}
              aria-label={t.account.cartTitle}
              aria-expanded={panel === "cart"}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-white"
            >
              <CartIcon className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[0.6rem] font-bold text-ink">
                0
              </span>
            </button>
            {panel === "cart" && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-line bg-paper p-4 text-ink shadow-xl">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  {t.account.cartTitle}
                </p>
                <p className="mt-2 text-sm text-muted">{t.account.cartEmpty}</p>
                <p className="mt-3 text-[0.65rem] uppercase tracking-wide text-muted">
                  {t.account.soon}
                </p>
              </div>
            )}
          </div>
          </div>

          <a
            href="#contact"
            className="hidden rounded-full bg-white px-5 py-2 text-[0.8rem] font-semibold uppercase tracking-wide text-ink transition hover:bg-cream sm:inline-block"
          >
            {t.nav.contact}
          </a>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 text-white xl:hidden"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform ${
                  open ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition-transform ${
                  open ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line-dark bg-ink xl:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-3 sm:px-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className="border-b border-white/10 px-1 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white/80 transition last:border-0 hover:text-white"
              >
                {t.nav[l.key]}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-full bg-white px-5 py-3 text-center text-sm font-semibold uppercase tracking-wide text-ink"
            >
              {t.nav.contact}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
