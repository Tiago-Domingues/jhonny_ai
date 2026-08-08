"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Logo } from "@/components/Logo";
import { MENU_CATEGORIES, type NavKey } from "@/lib/i18n";
import { CartIcon, UserIcon, FlagPT, FlagEN, FlagZH } from "@/components/icons";
import { LOCALE_META, LOCALES, type Locale } from "@/lib/i18n";
import { categoryGroupHref, displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";
import { DispatchBanner } from "@/components/DispatchBanner";

type Panel = "cart" | "account" | null;

type HeaderUser = {
  fullName?: string;
  username?: string;
  email?: string;
  role?: "CUSTOMER" | "ADMIN";
} | null;

type MenuCategory = {
  key: NavKey;
  anchor: string;
  items: string[];
};

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Header({ categories }: { categories?: MenuCategory[] }) {
  const { t, locale, setLocale } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [desktopCat, setDesktopCat] = useState<NavKey | null>(null);
  const [user, setUser] = useState<HeaderUser>(null);
  const [cartCount, setCartCount] = useState(0);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(
    categories?.length ? categories : MENU_CATEGORIES
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (categories?.length) {
      setMenuCategories(categories);
      return;
    }
    fetch("/api/menu-categories")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (Array.isArray(data?.categories) && data.categories.length) {
          setMenuCategories(data.categories);
        }
      })
      .catch(() => undefined);
  }, [categories]);

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

  useEffect(() => {
    const refresh = () => {
      fetch("/api/auth/me")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => setUser(data?.user || null))
        .catch(() => undefined);
      fetch("/api/cart")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => setCartCount(data?.cart?.itemCount || 0))
        .catch(() => undefined);
    };
    refresh();
    window.addEventListener("jss-cart-updated", refresh);
    return () => window.removeEventListener("jss-cart-updated", refresh);
  }, []);

  useEffect(() => {
    return () => {
      if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setPanel(null);
  }

  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? null : p));
  const label = (item: string) => t.menuItems[item] ?? displayOdooCategoryName(item);
  const categoryHref = (key: NavKey) => categoryGroupHref(key);
  const subcategoryHref = (key: NavKey, item: string) =>
    categoryGroupHref(key, { subcategory: item });

  const activeDesktopCategory =
    desktopCat != null ? menuCategories.find((cat) => cat.key === desktopCat) : null;

  function openMega(key: NavKey) {
    if (megaCloseTimer.current) {
      clearTimeout(megaCloseTimer.current);
      megaCloseTimer.current = null;
    }
    setDesktopCat(key);
    setPanel(null);
    setLangOpen(false);
  }

  function scheduleCloseMega() {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    megaCloseTimer.current = setTimeout(() => setDesktopCat(null), 120);
  }

  const shopAllLabel =
    locale === "pt" ? "Ver tudo" : locale === "zh" ? "查看全部" : "Shop all";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-ink transition-all duration-300 ${
        scrolled ? "border-b border-line-dark shadow-lg shadow-black/20" : ""
      }`}
      onMouseLeave={scheduleCloseMega}
    >
      <div className="mx-auto flex max-w-[96rem] items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Jhonny Surf Store" className="shrink-0">
          <Logo type="horizontal" variant="dark" priority className="h-9 sm:h-10" />
        </Link>

        <nav className="hidden items-center gap-1 xl:flex 2xl:gap-2" onMouseEnter={() => {
          if (megaCloseTimer.current) {
            clearTimeout(megaCloseTimer.current);
            megaCloseTimer.current = null;
          }
        }}>
          {menuCategories.map((cat) => {
            const isActive = desktopCat === cat.key;
            return (
              <Link
                key={cat.key}
                href={categoryHref(cat.key)}
                onMouseEnter={() => openMega(cat.key)}
                onFocus={() => openMega(cat.key)}
                className={`relative px-2.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.08em] transition 2xl:px-3 2xl:text-[0.75rem] 2xl:tracking-[0.1em] ${
                  isActive ? "text-white" : "text-white/80 hover:text-white"
                }`}
              >
                {t.nav[cat.key]}
                <span
                  className={`absolute inset-x-2.5 bottom-0 h-[2px] origin-left bg-white transition-transform duration-200 2xl:inset-x-3 ${
                    isActive ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setLangOpen((value) => !value);
                setDesktopCat(null);
              }}
              aria-label="Change language"
              aria-expanded={langOpen}
              className="flex items-center gap-1.5 rounded-full border border-white/30 px-2.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-white transition hover:border-white"
            >
              {locale === "pt" ? (
                <FlagPT className="h-3.5 w-5 rounded-[2px]" />
              ) : locale === "zh" ? (
                <FlagZH className="h-3.5 w-5 rounded-[2px]" />
              ) : (
                <FlagEN className="h-3.5 w-5 rounded-[2px]" />
              )}
              <span>{LOCALE_META[locale].short}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-line bg-paper py-1 text-ink shadow-xl">
                {LOCALES.map((code) => {
                  const Flag = code === "pt" ? FlagPT : code === "zh" ? FlagZH : FlagEN;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setLocale(code as Locale);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold uppercase tracking-wide transition hover:bg-cream ${
                        locale === code ? "bg-cream text-ink" : "text-muted"
                      }`}
                    >
                      <Flag className="h-3.5 w-5 rounded-[2px]" />
                      <span>{LOCALE_META[code].label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div ref={menuRef} className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => {
                  togglePanel("account");
                  setDesktopCat(null);
                }}
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
                  {user && (
                    <p className="px-3 pb-2 text-sm font-semibold text-ink">
                      {user.fullName || user.username || user.email}
                    </p>
                  )}
                  <a
                    href="/conta"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                  >
                    {user ? t.account.title : t.account.signIn}
                  </a>
                  {!user && (
                    <a
                      href="/conta"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                    >
                      {t.account.register}
                    </a>
                  )}
                  <a
                    href="/encomendas"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                  >
                    {t.account.orders}
                  </a>
                  {user?.role === "ADMIN" && (
                    <a
                      href="/admin/encomendas"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                    >
                      Admin encomendas
                    </a>
                  )}
                  {user && (
                    <button
                      type="button"
                      onClick={logout}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                    >
                      Sair
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  togglePanel("cart");
                  setDesktopCat(null);
                }}
                aria-label={t.account.cartTitle}
                aria-expanded={panel === "cart"}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-white"
              >
                <CartIcon className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[0.6rem] font-bold text-ink">
                  {cartCount}
                </span>
              </button>
              {panel === "cart" && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-line bg-paper p-4 text-ink shadow-xl">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
                    {t.account.cartTitle}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {cartCount > 0 ? `${cartCount} item(s) no carrinho.` : t.account.cartEmpty}
                  </p>
                  <div className="mt-4 grid gap-2">
                    <a
                      href="/loja"
                      className="rounded-full border border-line px-4 py-2 text-center text-xs font-bold uppercase tracking-wide"
                    >
                      Continuar compras
                    </a>
                    <a
                      href="/checkout"
                      className="rounded-full bg-ink px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-white"
                    >
                      Checkout
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

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

      {/* Full-width mega menu bar (Pukas-style) */}
      <div
        className={`hidden overflow-hidden border-t border-white/10 bg-paper text-ink transition-[max-height,opacity] duration-200 xl:block ${
          activeDesktopCategory
            ? "max-h-[320px] opacity-100 shadow-xl"
            : "pointer-events-none max-h-0 opacity-0"
        }`}
        onMouseEnter={() => {
          if (megaCloseTimer.current) {
            clearTimeout(megaCloseTimer.current);
            megaCloseTimer.current = null;
          }
        }}
      >
        {activeDesktopCategory && (
          <div className="mx-auto max-w-[96rem] px-6 py-6 lg:px-8">
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-3">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted">
                  {t.nav[activeDesktopCategory.key]}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {locale === "pt"
                    ? "Escolhe uma subcategoria"
                    : locale === "zh"
                      ? "选择子分类"
                      : "Choose a subcategory"}
                </p>
              </div>
              <Link
                href={categoryHref(activeDesktopCategory.key)}
                className="text-xs font-bold uppercase tracking-[0.14em] text-ink underline-offset-4 transition hover:underline"
                onClick={() => setDesktopCat(null)}
              >
                {shopAllLabel}
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {activeDesktopCategory.items.map((item) => (
                <Link
                  key={item}
                  href={subcategoryHref(activeDesktopCategory.key, item)}
                  onClick={() => setDesktopCat(null)}
                  className="text-sm font-medium uppercase tracking-[0.08em] text-ink/80 transition hover:text-ink"
                >
                  {label(item)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <DispatchBanner />

      {open && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-line-dark bg-ink xl:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-2 sm:px-8">
            {menuCategories.map((cat) => {
              const expanded = openCat === cat.key;
              return (
                <div key={cat.key} className="border-b border-white/10 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={categoryHref(cat.key)}
                      onClick={() => setOpen(false)}
                      className="flex-1 px-1 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white/80 transition hover:text-white"
                    >
                      {t.nav[cat.key]}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpenCat((c) => (c === cat.key ? null : cat.key))}
                      aria-expanded={expanded}
                      className="px-3 py-3.5 text-white/80 transition hover:text-white"
                    >
                      <span className="sr-only">Abrir subcategorias</span>
                      <Chevron
                        className={`h-4 w-4 transition-transform duration-200 ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                  {expanded && (
                    <div className="pb-3 pl-2">
                      {cat.items.map((item) => (
                        <Link
                          key={item}
                          href={subcategoryHref(cat.key, item)}
                          onClick={() => setOpen(false)}
                          className="block w-full rounded-md px-2 py-2 text-left text-[0.8rem] tracking-wide text-white/65 transition hover:text-white"
                        >
                          {label(item)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
