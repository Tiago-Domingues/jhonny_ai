"use client";

import { FormEvent, useEffect, useState } from "react";
import { CurrencyNote, CurrencyPrice, CurrencySelector } from "@/components/CurrencyDisplay";

type CartSummary = {
  itemCount: number;
  subtotalCents: number;
  items: Array<{ id: string; name: string; quantity: number; totalCents: number }>;
};

export function CheckoutClient() {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("MBWAY");
  const [fulfillmentMethod, setFulfillmentMethod] = useState("PICKUP_IN_STORE");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscountCents, setCouponDiscountCents] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cart")
      .then((response) => response.json())
      .then((data) => setCart(data.cart))
      .catch(() => setCart({ itemCount: 0, subtotalCents: 0, items: [] }));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        fulfillmentMethod,
        paymentMethod,
        marketingOptIn: form.get("marketingOptIn") === "on",
        billingSameAsShipping,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Não foi possível criar a encomenda.");
      return;
    }
    setMessage(`Encomenda ${data.order.orderNumber} criada. Confirma o email para os próximos passos.`);
    window.dispatchEvent(new Event("jss-cart-updated"));
  }

  async function applyCoupon() {
    setCouponMessage(null);
    setCouponDiscountCents(0);
    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode }),
    });
    const data = await response.json();
    if (!response.ok) {
      setCouponMessage(data.message || "Cupão inválido.");
      return;
    }
    setCouponDiscountCents(data.discountCents || 0);
    setCouponCode(data.coupon?.code || couponCode);
    setCouponMessage(`${data.coupon?.code} aplicado: ${data.coupon?.percentOff}% off.`);
  }

  const discountedSubtotalCents = Math.max(0, (cart?.subtotalCents || 0) - couponDiscountCents);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
      <form onSubmit={submit} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <input name="fullName" required placeholder="Nome completo" className="rounded-2xl border border-line px-4 py-3" />
          <input name="email" required type="email" placeholder="Email" className="rounded-2xl border border-line px-4 py-3" />
          <div className="grid grid-cols-[minmax(96px,0.45fr)_1fr] gap-2">
            <select name="phoneCountryCode" defaultValue="+351" className="rounded-2xl border border-line px-4 py-3">
              <option value="+351">PT +351</option>
              <option value="+34">ES +34</option>
              <option value="+33">FR +33</option>
              <option value="+44">UK +44</option>
              <option value="+49">DE +49</option>
              <option value="+1">US/CA +1</option>
            </select>
            <input name="phone" required placeholder="Telemóvel" className="rounded-2xl border border-line px-4 py-3" />
          </div>
          <input name="mbwayPhone" placeholder="Telemóvel MB WAY" className="rounded-2xl border border-line px-4 py-3" />

          <div className="md:col-span-2">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted">Entrega</p>
            <div className="grid gap-2 md:grid-cols-2">
              <button type="button" onClick={() => setFulfillmentMethod("PICKUP_IN_STORE")} className={`rounded-2xl border px-4 py-3 text-left font-semibold ${fulfillmentMethod === "PICKUP_IN_STORE" ? "border-ink bg-ink text-white" : "border-line"}`}>
                Pagar online e levantar na loja
              </button>
              <button type="button" onClick={() => setFulfillmentMethod("SHIP_TO_ADDRESS")} className={`rounded-2xl border px-4 py-3 text-left font-semibold ${fulfillmentMethod === "SHIP_TO_ADDRESS" ? "border-ink bg-ink text-white" : "border-line"}`}>
                Enviar para morada
              </button>
            </div>
          </div>

          {fulfillmentMethod === "SHIP_TO_ADDRESS" && (
            <>
              <input name="addressLine1" placeholder="Morada" className="rounded-2xl border border-line px-4 py-3 md:col-span-2" />
              <input name="addressLine2" placeholder="Detalhes morada" className="rounded-2xl border border-line px-4 py-3 md:col-span-2" />
              <input name="postalCode" placeholder="Código postal" className="rounded-2xl border border-line px-4 py-3" />
              <input name="city" placeholder="Cidade" className="rounded-2xl border border-line px-4 py-3" />
            </>
          )}

          <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
            <input checked={billingSameAsShipping} onChange={(event) => setBillingSameAsShipping(event.currentTarget.checked)} type="checkbox" className="mt-1" />
            Morada de faturação igual à morada de entrega
          </label>

          {!billingSameAsShipping && (
            <>
              <input name="billingAddressLine1" placeholder="Morada de faturação" className="rounded-2xl border border-line px-4 py-3 md:col-span-2" />
              <input name="billingAddressLine2" placeholder="Detalhes morada de faturação" className="rounded-2xl border border-line px-4 py-3 md:col-span-2" />
              <input name="billingPostalCode" placeholder="Código postal faturação" className="rounded-2xl border border-line px-4 py-3" />
              <input name="billingCity" placeholder="Cidade faturação" className="rounded-2xl border border-line px-4 py-3" />
              <input name="billingCountry" maxLength={2} defaultValue="PT" placeholder="País faturação" className="rounded-2xl border border-line px-4 py-3" />
            </>
          )}

          <div className="md:col-span-2">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted">Pagamento</p>
            <div className="grid gap-2 md:grid-cols-4">
              {["MBWAY", "MULTIBANCO", "PAYPAL", "KLARNA"].map((method) => (
                <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`rounded-2xl border px-4 py-3 text-sm font-bold ${paymentMethod === method ? "border-ink bg-ink text-white" : "border-line"}`}>
                  {method === "MULTIBANCO" ? "Entidade/ref." : method}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 md:col-span-2 md:grid-cols-[1fr_auto]">
            <input
              name="couponCode"
              value={couponCode}
              onChange={(event) => {
                setCouponCode(event.currentTarget.value);
                setCouponDiscountCents(0);
                setCouponMessage(null);
              }}
              placeholder="Cupão de atleta"
              className="rounded-2xl border border-line px-4 py-3"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={!couponCode.trim()}
              className="rounded-full border border-line px-5 py-3 text-sm font-bold uppercase tracking-wide text-ink disabled:opacity-50"
            >
              Aplicar cupão
            </button>
            {couponMessage && <p className="text-sm text-muted md:col-span-2">{couponMessage}</p>}
          </div>

          <textarea name="notes" placeholder="Notas para a encomenda" className="rounded-2xl border border-line px-4 py-3 md:col-span-2" />
          <label className="flex items-start gap-2 text-sm text-muted md:col-span-2">
            <input name="marketingOptIn" type="checkbox" className="mt-1" />
            Aceito receber novidades e lembretes de carrinho da Jhonny Surf Store.
          </label>
          <button className="rounded-full bg-ink px-5 py-3 font-bold uppercase tracking-wide text-white md:col-span-2">
            Confirmar encomenda
          </button>
          {message && <p className="rounded-xl bg-cream p-3 text-sm text-muted md:col-span-2">{message}</p>}
        </div>
      </form>

      <aside className="h-fit rounded-3xl border border-line bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Resumo</p>
        <div className="mt-4 space-y-3">
          {cart?.items?.length ? (
            cart.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-3">
                <span className="min-w-0">{item.quantity} x {item.name}</span>
                <span className="font-semibold sm:text-right"><CurrencyPrice cents={item.totalCents} /></span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">O carrinho está vazio.</p>
          )}
        </div>
        <div className="mt-5 border-t border-line pt-4">
          {couponDiscountCents > 0 && (
            <div className="mb-3 flex justify-between text-sm font-semibold text-muted">
              <span>Coupon discount</span>
              <span>-<CurrencyPrice cents={couponDiscountCents} /></span>
            </div>
          )}
          <div className="flex flex-col gap-1 font-display text-2xl font-extrabold sm:flex-row sm:justify-between">
            <span>Total</span>
            <span className="sm:text-right"><CurrencyPrice cents={discountedSubtotalCents} /></span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <CurrencySelector compact />
            <CurrencyNote />
          </div>
          <p className="mt-2 text-xs text-muted">
            Portes grátis em encomendas acima de €50. Levantamento em loja é gratuito.
          </p>
        </div>
      </aside>
    </div>
  );
}
