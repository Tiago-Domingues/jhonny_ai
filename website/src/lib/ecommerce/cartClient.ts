"use client";

import { useEffect, useState } from "react";
import { bustStorefrontCache, storefrontGetJson } from "@/lib/storefrontFetch";

export type CartLine = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  quantity: number;
  unitPriceCents?: number;
  totalCents: number;
  stockQuantity?: number;
  category?: string | null;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
};

export type CartSummary = {
  id?: string | null;
  items: CartLine[];
  itemCount: number;
  subtotalCents: number;
  currency?: string;
};

export async function updateCartQuantity(itemId: string, quantity: number) {
  const response = await fetch("/api/cart", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, quantity }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Could not update the cart.");
  }
  window.dispatchEvent(new Event("jss-cart-updated"));
  return data.cart as CartSummary;
}

export function useCartSummary() {
  const [cart, setCart] = useState<CartSummary>({ items: [], itemCount: 0, subtotalCents: 0 });

  useEffect(() => {
    function applyCart(data: { cart?: Partial<CartSummary> } | null) {
      const next = data?.cart;
      setCart({
        id: next?.id || null,
        items: Array.isArray(next?.items) ? next.items : [],
        itemCount: next?.itemCount || 0,
        subtotalCents: next?.subtotalCents || 0,
        currency: next?.currency,
      });
    }

    function refresh(bust = false) {
      if (bust) bustStorefrontCache("/api/cart");
      storefrontGetJson<{ cart?: Partial<CartSummary> }>("/api/cart", { bust }).then(applyCart);
    }

    refresh(false);
    const onUpdated = () => refresh(true);
    window.addEventListener("jss-cart-updated", onUpdated);
    return () => window.removeEventListener("jss-cart-updated", onUpdated);
  }, []);

  return cart;
}
