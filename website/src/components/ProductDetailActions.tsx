"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { NotifyWhenAvailable } from "@/components/NotifyWhenAvailable";
import { shopperStockError, storefrontText } from "@/lib/storefrontCopy";

export function ProductDetailActions({
  productId,
  productName,
  availableForSale,
}: {
  productId: string;
  productName: string;
  availableForSale: boolean;
}) {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).product;
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function addToCart() {
    setAdding(true);
    setMessage(null);
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const data = await response.json();
    setAdding(false);
    if (!response.ok) {
      setMessage(shopperStockError(data.message || copy.addFailed, locale));
      return;
    }
    setMessage(copy.added);
    window.dispatchEvent(new Event("jss-cart-updated"));
  }

  return (
    <div className="mt-8">
      {availableForSale ? (
        <button
          type="button"
          onClick={addToCart}
          disabled={adding}
          className="w-full rounded-full bg-ink px-6 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-ink-soft disabled:opacity-60 sm:w-auto"
        >
          {adding ? copy.adding : copy.add}
        </button>
      ) : (
        <NotifyWhenAvailable
          productId={productId}
          productName={productName}
          onResult={(ok) => setMessage(ok ? copy.notifyOk : copy.notifyFailed)}
        />
      )}
      {message && <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-muted">{message}</p>}
    </div>
  );
}
