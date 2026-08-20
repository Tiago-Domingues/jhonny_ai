"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { formatEuro } from "@/lib/ecommerce/money";

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  totalCents: number;
  currency: string;
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

const statuses = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<{ openCount: number; paidCount: number; totalOrders: number } | null>(null);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const selected = orders.find((order) => order.id === selectedId) || null;

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ q, status, limit: "100" });
      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (response.status === 401) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.message || data.error || "Não foi possível carregar encomendas.");
        setOrders([]);
        setLoading(false);
        return;
      }
      setUnauthorized(false);
      setOrders(data.orders || []);
      setStats(data.stats || null);
      setTotal(data.total || 0);
    } catch {
      setMessage("Erro de rede ao carregar encomendas.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const nextStatus = String(form.get("status") || selected.status);
    const response = await fetch(`/api/admin/orders/${selected.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.message || "Não foi possível atualizar o estado.");
      return;
    }
    setMessage("Estado atualizado.");
    await load();
    setSelectedId(selected.id);
  }

  if (unauthorized) {
    return (
      <div className="rounded-3xl border border-line bg-white p-8">
        <p className="font-display text-2xl font-extrabold uppercase text-ink">Acesso restrito</p>
        <a href="/conta" className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
          Ir para a conta
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      {stats && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Total encomendas", stats.totalOrders],
            ["Em curso", stats.openCount],
            ["Pagas", stats.paidCount],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-line pb-3">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
              <p className="font-display mt-2 text-3xl font-extrabold text-ink">{value}</p>
            </div>
          ))}
        </div>
      )}

      <form
        className="grid gap-3 sm:grid-cols-[1.4fr_0.9fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Pesquisar nº, email, nome, telefone…"
          className="rounded-2xl border border-line bg-white px-4 py-3"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-line bg-white px-4 py-3"
        >
          <option value="all">Todos os estados</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
          Filtrar
        </button>
      </form>

      {message && <p className="rounded-xl bg-white p-3 text-sm text-muted">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
              {loading ? "A carregar…" : `${total} encomenda(s)`}
            </p>
          </div>
          <div className="divide-y divide-line">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedId(order.id)}
                className={`grid w-full gap-1 px-5 py-4 text-left transition hover:bg-cream/60 ${
                  selectedId === order.id ? "bg-cream" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-lg font-extrabold uppercase text-ink">{order.orderNumber}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">{formatDate(order.createdAt)}</p>
                </div>
                <p className="text-sm text-muted">
                  {order.customerName} · {order.customerEmail}
                </p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  <span>{order.status}</span>
                  <span>{order.fulfillmentMethod}</span>
                  <span>{formatEuro(order.totalCents)}</span>
                </div>
              </button>
            ))}
            {!loading && orders.length === 0 && (
              <p className="px-5 py-10 text-sm text-muted">Ainda não há encomendas com estes filtros.</p>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-line bg-white p-6">
          {!selected ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Detalhe</p>
              <p className="font-display mt-3 text-2xl font-extrabold uppercase text-ink">Seleciona uma encomenda</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Vê itens, pagamento e atualiza o estado operacional.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Gerir encomenda</p>
                <h2 className="font-display mt-2 text-3xl font-extrabold uppercase text-ink">{selected.orderNumber}</h2>
                <p className="mt-1 text-sm text-muted">
                  {selected.customerName} · {selected.customerEmail}
                </p>
                {selected.customerPhone && <p className="text-sm text-muted">{selected.customerPhone}</p>}
              </div>

              <div className="rounded-2xl bg-cream px-4 py-3 text-sm text-muted">
                <p>Total: <span className="font-bold text-ink">{formatEuro(selected.totalCents)}</span></p>
                <p>Fulfillment: {selected.fulfillmentMethod}</p>
                <p>
                  Pagamento: {selected.payment?.method || "—"} ({selected.payment?.status || "—"})
                </p>
                {selected.payment?.multibancoReference && (
                  <p>
                    {selected.payment.method === "PAYSHOP" ? "Payshop" : "MB"}:{" "}
                    {selected.payment.multibancoEntity ? `${selected.payment.multibancoEntity} / ` : ""}
                    {selected.payment.multibancoReference}
                  </p>
                )}
              </div>

              <ul className="grid gap-2 text-sm text-muted">
                {selected.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 border-b border-line py-2">
                    <span>
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-semibold text-ink">{formatEuro(item.totalCents)}</span>
                  </li>
                ))}
              </ul>

              <form onSubmit={updateStatus} className="grid gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">Estado</span>
                  <select name="status" defaultValue={selected.status} className="rounded-2xl border border-line px-4 py-3">
                    {statuses.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
                  Atualizar estado
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
