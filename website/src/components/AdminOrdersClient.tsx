"use client";

import { useEffect, useState } from "react";
import { CurrencyPrice } from "@/components/CurrencyDisplay";

type OrderView = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  totalCents: number;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number }>;
  payment: { method: string; status: string } | null;
};

const STATUS_OPTIONS = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setError(null);
    const response = await fetch("/api/admin/orders");
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || data.error || "Não foi possível carregar encomendas.");
      setOrders([]);
      return;
    }
    setOrders(data.orders || []);
  }

  useEffect(() => {
    load().catch(() => setError("Não foi possível carregar encomendas."));
  }, []);

  async function updateStatus(orderId: string, status: string) {
    setBusyId(orderId);
    setError(null);
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    setBusyId(null);
    if (!response.ok) {
      setError(data.message || "Falha ao atualizar estado.");
      return;
    }
    await load();
  }

  if (orders === null) {
    return <p className="text-sm text-muted">A carregar encomendas…</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-cream p-3 text-sm text-muted">{error}</p>}
      {!orders.length ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-muted">
          Ainda não há encomendas.
        </p>
      ) : (
        orders.map((order) => (
          <article key={order.id} className="rounded-3xl border border-line bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{order.orderNumber}</p>
                <p className="mt-1 font-semibold text-ink">
                  {order.customerName} · {order.customerEmail}
                </p>
                <p className="text-sm text-muted">
                  {new Date(order.createdAt).toLocaleString("pt-PT")}
                  {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                </p>
              </div>
              <p className="font-display text-xl font-extrabold">
                <CurrencyPrice cents={order.totalCents} />
              </p>
            </div>
            <ul className="mt-3 text-sm text-muted">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity} × {item.name}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-xs uppercase tracking-wide text-muted">
                {order.fulfillmentMethod === "PICKUP_IN_STORE" ? "Pickup" : "Ship"}
                {order.payment ? ` · ${order.payment.method}/${order.payment.status}` : ""}
              </p>
              <select
                className="rounded-2xl border border-line px-3 py-2 text-sm"
                value={order.status}
                disabled={busyId === order.id}
                onChange={(event) => updateStatus(order.id, event.currentTarget.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
