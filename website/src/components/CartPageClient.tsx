"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CurrencyPrice } from "@/components/CurrencyDisplay";
import { CartQtyControls } from "@/components/CartQtyControls";
import { useLanguage } from "@/components/LanguageProvider";
import { storefrontText } from "@/lib/storefrontCopy";
import { useCartSummary } from "@/lib/ecommerce/cartClient";

export function CartPageClient() {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).cart;
  const cart = useCartSummary();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">{copy.title}</p>
      <h1 className="font-display mt-3 text-5xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl">
        {copy.title}
      </h1>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
          {cart.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">{copy.empty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <Link
                    href={`/loja/${item.slug}`}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-line bg-cream"
                  >
                    <Image
                      src={item.imageUrl || "/brand/logo-stacked.svg"}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-contain p-2"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/loja/${item.slug}`} className="font-bold text-ink hover:text-muted">
                      {item.name}
                    </Link>
                    {typeof item.unitPriceCents === "number" && (
                      <p className="mt-1 text-sm text-muted">
                        {copy.unitPrice} <CurrencyPrice cents={item.unitPriceCents} />
                      </p>
                    )}
                    <CartQtyControls
                      itemId={item.id}
                      quantity={item.quantity}
                      stockQuantity={item.stockQuantity}
                      onError={setError}
                    />
                  </div>
                  <p className="shrink-0 font-semibold">
                    <CurrencyPrice cents={item.totalCents} />
                  </p>
                </li>
              ))}
            </ul>
          )}
          {error && <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm text-muted">{error}</p>}
        </div>
        <aside className="h-fit rounded-3xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>{copy.subtotal}</span>
            <CurrencyPrice cents={cart.subtotalCents} />
          </div>
          <div className="mt-5 grid gap-2">
            <Link
              href="/loja"
              className="rounded-full border border-line px-4 py-3 text-center text-xs font-bold uppercase tracking-wide transition hover:bg-cream"
            >
              {copy.continue}
            </Link>
            <Link
              href="/checkout"
              className="rounded-full bg-ink px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-white transition hover:bg-ink-soft"
            >
              {copy.checkout}
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
