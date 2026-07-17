"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Logo } from "@/components/Logo";
import { MENU_CATEGORIES, type NavKey } from "@/lib/i18n";
import { CartIcon, UserIcon, FlagPT, FlagEN } from "@/components/icons";
import { categoryGroupHref, displayOdooCategoryName } from "@/lib/ecommerce/categoryGroups";
import { DispatchBanner } from "@/components/DispatchBanner";

type Panel = "cart" | "account" | null;

type HeaderUser = {
  fullName?: string;
  username?: string;
  email?: string;
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
  const { t, locale, toggle } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [user, setUser] = useState<HeaderUser>(null);
  const [cartCount, setCartCount] = useState(0);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(
    categories?.length ? categories : MENU_CATEGORIES
  );
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line-dark bg-ink/95 backdrop-blur-md"
          : "bg-gradient-to-b from-black/60 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" aria-label="Jhonny Surf Store" className="shrink-0">
          <Logo type="horizontal" variant="dark" priority className="h-9 sm:h-10" />
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          {menuCategories.map((cat) => (
            <div key={cat.key} className="group relative">
              <Link
                href={categoryHref(cat.key)}
                className="flex items-center gap-1 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-white/85 transition hover:text-white"
              >
                {t.nav[cat.key]}
                <Chevron className="h-3 w-3 opacity-70 transition-transform duration-200 group-hover:rotate-180" />
              </Link>

              {/* Dropdown */}
              <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-xl border border-line bg-paper p-2 text-ink shadow-xl">
                  {cat.items.map((item) => (
                    <Link
                      key={item}
                      href={subcategoryHref(cat.key, item)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                    >
                      {label(item)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
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
                <a
                  href="/conta"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                >
                  {t.account.register}
                </a>
                <a
                  href="/checkout"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                >
                  {t.account.orders}
                </a>
                {user && (
                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                  >
                    Sair
                  </button>
                )}
                <p className="px-3 pb-1 pt-2 text-[0.65rem] uppercase tracking-wide text-muted">
                  Dados preparados para Odoo
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
                  <a href="/loja" className="rounded-full border border-line px-4 py-2 text-center text-xs font-bold uppercase tracking-wide">
                    Continuar compras
                  </a>
                  <a href="/checkout" className="rounded-full bg-ink px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-white">
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
                      onClick={() =>
                        setOpenCat((c) => (c === cat.key ? null : cat.key))
                      }
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
