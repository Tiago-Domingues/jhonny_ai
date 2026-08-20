"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { CurrencyPrice } from "@/components/CurrencyDisplay";

type CartLine = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  quantity: number;
  totalCents: number;
};

type CartSummary = {
  items: CartLine[];
  itemCount: number;
  subtotalCents: number;
};

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  emptyLabel: string;
  continueLabel: string;
  checkoutLabel: string;
  subtotalLabel: string;
};

export function CartDrawer({
  open,
  onClose,
  title,
  emptyLabel,
  continueLabel,
  checkoutLabel,
  subtotalLabel,
}: CartDrawerProps) {
  const [cart, setCart] = useState<CartSummary>({ items: [], itemCount: 0, subtotalCents: 0 });

  useEffect(() => {
    if (!open) return;

    function refresh() {
      fetch("/api/cart")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          const next = data?.cart;
          setCart({
            items: Array.isArray(next?.items) ? next.items : [],
            itemCount: next?.itemCount || 0,
            subtotalCents: next?.subtotalCents || 0,
          });
        })
        .catch(() => undefined);
    }

    refresh();
    window.addEventListener("jss-cart-updated", refresh);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("jss-cart-updated", refresh);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Close cart" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper text-ink shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">{title}</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line transition hover:bg-cream"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {cart.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">{emptyLabel}</p>
          ) : (
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <Link
                    href={`/loja/${item.slug}`}
                    onClick={onClose}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-white"
                  >
                    <Image
                      src={item.imageUrl || "/brand/logo-stacked.svg"}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain p-2"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/loja/${item.slug}`}
                      onClick={onClose}
                      className="line-clamp-2 text-sm font-bold text-ink transition hover:text-muted"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">Qty {item.quantity}</p>
                    <p className="mt-2 text-sm font-semibold">
                      <CurrencyPrice cents={item.totalCents} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line px-5 py-4">
          {cart.itemCount > 0 && (
            <div className="mb-4 flex items-center justify-between text-sm font-bold">
              <span>{subtotalLabel}</span>
              <CurrencyPrice cents={cart.subtotalCents} />
            </div>
          )}
          <div className="grid gap-2">
            <Link
              href="/loja"
              onClick={onClose}
              className="rounded-full border border-line px-4 py-3 text-center text-xs font-bold uppercase tracking-wide transition hover:bg-cream"
            >
              {continueLabel}
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="rounded-full bg-ink px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-white transition hover:bg-ink-soft"
            >
              {checkoutLabel}
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
