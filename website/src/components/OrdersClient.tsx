"use client";

import { FormEvent, useEffect, useState } from "react";
import { CurrencyPrice } from "@/components/CurrencyDisplay";

type OrderView = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: string;
  customerEmail: string;
  customerName: string;
  totalCents: number;
  shippingCents: number;
  discountCents: number;
  createdAt: string;
  paidAt: string | null;
  items: Array<{ id: string; name: string; quantity: number; totalCents: number }>;
  payment: {
    method: string;
    status: string;
    multibancoEntity: string | null;
    multibancoReference: string | null;
  } | null;
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function OrderCard({ order }: { order: OrderView }) {
  return (
    <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{order.orderNumber}</p>
          <p className="mt-1 text-sm text-muted">
            {new Date(order.createdAt).toLocaleString("pt-PT")} · {statusLabel(order.status)}
          </p>
        </div>
        <p className="font-display text-xl font-extrabold">
          <CurrencyPrice cents={order.totalCents} />
        </p>
      </div>
      <ul className="mt-4 space-y-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>
              {item.quantity} × {item.name}
            </span>
            <span className="font-semibold">
              <CurrencyPrice cents={item.totalCents} />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        {order.fulfillmentMethod === "PICKUP_IN_STORE" ? "Levantamento em loja" : "Envio"}
        {order.payment ? ` · ${order.payment.method} (${statusLabel(order.payment.status)})` : ""}
        {order.payment?.multibancoEntity
          ? ` · Entidade ${order.payment.multibancoEntity} / Ref. ${order.payment.multibancoReference}`
          : ""}
      </p>
    </article>
  );
}

export function OrdersClient() {
  const [sessionOrders, setSessionOrders] = useState<OrderView[] | null>(null);
  const [lookupOrder, setLookupOrder] = useState<OrderView | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data?.user) {
          setSignedIn(false);
          setSessionOrders([]);
          return;
        }
        setSignedIn(true);
        return fetch("/api/orders")
          .then((response) => response.json())
          .then((ordersData) => setSessionOrders(ordersData.orders || []))
          .catch(() => setSessionOrders([]));
      })
      .catch(() => {
        setSignedIn(false);
        setSessionOrders([]);
      });
  }, []);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLookupOrder(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        orderNumber: form.get("orderNumber"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Encomenda não encontrada.");
      return;
    }
    setLookupOrder(data.order);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">As tuas encomendas</p>
          <h2 className="font-display mt-2 text-3xl font-extrabold uppercase text-ink">
            {signedIn ? "Histórico da conta" : "Consulta de encomenda"}
          </h2>
        </div>
        {sessionOrders === null ? (
          <p className="text-sm text-muted">A carregar…</p>
        ) : signedIn && sessionOrders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-sm text-muted">
            Ainda não há encomendas nesta conta. Podes comprar na{" "}
            <a href="/loja" className="font-semibold text-ink underline underline-offset-2">
              loja online
            </a>
            .
          </p>
        ) : (
          sessionOrders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
        {lookupOrder && <OrderCard order={lookupOrder} />}
      </section>

      <aside className="h-fit rounded-3xl border border-line bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Sem conta?</p>
        <h3 className="font-display mt-2 text-2xl font-extrabold uppercase">Procurar encomenda</h3>
        <p className="mt-2 text-sm text-muted">
          Usa o email da compra e o número da encomenda (ex.: JSS-…).
        </p>
        <form onSubmit={lookup} className="mt-5 grid gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="Email da encomenda"
            className="rounded-2xl border border-line px-4 py-3"
          />
          <input
            name="orderNumber"
            required
            placeholder="Número da encomenda"
            className="rounded-2xl border border-line px-4 py-3"
          />
          <button className="rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
            Ver encomenda
          </button>
        </form>
        {message && <p className="mt-4 rounded-xl bg-cream p-3 text-sm text-muted">{message}</p>}
        {!signedIn && (
          <p className="mt-4 text-sm text-muted">
            Tens conta?{" "}
            <a href="/conta" className="font-semibold text-ink underline underline-offset-2">
              Entra aqui
            </a>{" "}
            para ver o histórico completo.
          </p>
        )}
      </aside>
    </div>
  );
}
