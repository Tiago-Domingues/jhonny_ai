"use client";

import { FormEvent, useState } from "react";

export function ProductDetailActions({
  productId,
  productName,
  availableForSale,
}: {
  productId: string;
  productName: string;
  availableForSale: boolean;
}) {
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
      setMessage(data.message || "Não foi possível adicionar ao carrinho.");
      return;
    }
    setMessage("Produto adicionado ao carrinho.");
    window.dispatchEvent(new Event("jss-cart-updated"));
  }

  async function askWhenAvailable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        email: form.get("email"),
        name: form.get("name"),
        phoneCountryCode: form.get("phoneCountryCode"),
        phone: form.get("phone"),
        message: `Notify me when ${productName} is available.`,
      }),
    });
    setMessage(
      response.ok
        ? "Pedido registado. Avisamos quando voltar a estar disponível."
        : "Não foi possível registar o pedido."
    );
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
          {adding ? "A adicionar..." : "Adicionar ao carrinho"}
        </button>
      ) : (
        <form onSubmit={askWhenAvailable} className="grid max-w-xl gap-3 rounded-3xl bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
            Avisar quando disponível
          </p>
          <input name="email" required type="email" placeholder="Email" className="rounded-2xl border border-line px-4 py-3" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" placeholder="Nome" className="rounded-2xl border border-line px-4 py-3" />
            <div className="grid grid-cols-[0.45fr_1fr] gap-2">
              <select name="phoneCountryCode" defaultValue="+351" className="rounded-2xl border border-line px-4 py-3">
                <option value="+351">+351</option>
                <option value="+34">+34</option>
                <option value="+33">+33</option>
                <option value="+44">+44</option>
                <option value="+49">+49</option>
                <option value="+1">+1</option>
              </select>
              <input name="phone" placeholder="Telefone" className="rounded-2xl border border-line px-4 py-3" />
            </div>
          </div>
          <button className="rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
            Pedir aviso
          </button>
        </form>
      )}
      {message && <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-muted">{message}</p>}
    </div>
  );
}
