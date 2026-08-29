"use client";

import { updateCartQuantity } from "@/lib/ecommerce/cartClient";
import { useLanguage } from "@/components/LanguageProvider";
import { shopperStockError, storefrontText } from "@/lib/storefrontCopy";

export function CartQtyControls({
  itemId,
  quantity,
  stockQuantity,
  onError,
}: {
  itemId: string;
  quantity: number;
  stockQuantity?: number;
  onError?: (message: string) => void;
}) {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).cart;
  const max = stockQuantity && stockQuantity > 0 ? stockQuantity : 20;

  async function setQuantity(next: number) {
    try {
      await updateCartQuantity(itemId, next);
    } catch (error) {
      onError?.(error instanceof Error ? shopperStockError(error.message, locale) : copy.remove);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-full border border-line">
        <button
          type="button"
          aria-label={copy.decrease}
          className="px-3 py-1 text-sm font-bold"
          onClick={() => setQuantity(quantity - 1)}
        >
          −
        </button>
        <span className="min-w-[1.5rem] text-center text-sm font-semibold">{quantity}</span>
        <button
          type="button"
          aria-label={copy.increase}
          disabled={quantity >= max}
          className="px-3 py-1 text-sm font-bold disabled:opacity-40"
          onClick={() => setQuantity(quantity + 1)}
        >
          +
        </button>
      </div>
      <button type="button" className="text-xs font-bold uppercase tracking-wide text-muted underline" onClick={() => setQuantity(0)}>
        {copy.remove}
      </button>
    </div>
  );
}
