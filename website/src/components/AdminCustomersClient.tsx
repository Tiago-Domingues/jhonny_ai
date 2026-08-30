"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type AdminCustomer = {
  id: string;
  email: string;
  username: string;
  role: "CUSTOMER" | "ADMIN";
  hasGoogle: boolean;
  hasPassword: boolean;
  createdAt: string;
  orderCount: number;
  profile: {
    fullName: string;
    phoneCountryCode: string;
    phone: string | null;
    customerType: string;
    preferredLanguage: string;
    city: string | null;
    country: string;
    marketingOptIn: boolean;
    odooPartnerId: number | null;
    odooSyncStatus: string;
  } | null;
};

type Stats = {
  totalCustomers: number;
  googleSignups: number;
  marketingOptIn: number;
  newLast7Days: number;
};

const customerTypeLabels: Record<string, string> = {
  PROFESSIONAL: "Professional",
  SURFER: "Surfer",
  BEGINNER: "Beginner",
  TOURIST: "Tourist",
  ERASMUS_STUDENT: "Erasmus",
  SURF_PARENT: "Surf parent",
  LOCAL_CUSTOMER: "Local",
  OTHER: "Other",
  BODYBOARDER: "Bodyboarder",
  LONGBOARDER: "Longboarder",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function phoneLabel(customer: AdminCustomer) {
  const phone = customer.profile?.phone?.trim();
  if (!phone) return "—";
  return `${customer.profile?.phoneCountryCode || ""} ${phone}`.trim();
}

export function AdminCustomersClient() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [auth, setAuth] = useState<"all" | "google" | "password">("all");
  const [marketing, setMarketing] = useState<"all" | "yes" | "no">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState("");

  const selected = useMemo(
    () => customers.find((customer) => customer.id === selectedId) || null,
    [customers, selectedId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({
        q,
        auth,
        marketing,
        limit: "100",
      });
      const response = await fetch(`/api/admin/customers?${params.toString()}`);
      if (response.status === 401) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.message || data.error || "Não foi possível carregar os clientes.");
        setCustomers([]);
        setLoading(false);
        return;
      }
      setUnauthorized(false);
      setCustomers(data.customers || []);
      setStats(data.stats || null);
      setTotal(data.total || 0);
    } catch {
      setMessage("Erro de rede ao carregar clientes.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [q, auth, marketing]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function saveSelected(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") || ""),
      phoneCountryCode: String(form.get("phoneCountryCode") || "+351"),
      phone: String(form.get("phone") || "") || null,
      customerType: String(form.get("customerType") || "SURFER"),
      marketingOptIn: form.get("marketingOptIn") === "on",
      role: String(form.get("role") || "CUSTOMER") as "CUSTOMER" | "ADMIN",
    };
    const response = await fetch(`/api/admin/customers/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Não foi possível guardar.");
      return;
    }
    setCustomers((prev) => prev.map((item) => (item.id === selected.id ? data.customer : item)));
    setMessage("Cliente atualizado.");
  }

  async function removeSelected() {
    if (!selected || removing) return;
    const label = selected.profile?.fullName || selected.email;
    if (!window.confirm(`Remover ${label} e os dados desta conta? Esta ação não se desfaz.`)) {
      return;
    }
    setRemoving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/customers/${selected.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.message || data.error || "Não foi possível remover o cliente.");
        return;
      }
      setCustomers((prev) => prev.filter((item) => item.id !== selected.id));
      setSelectedId(null);
      setTotal((value) => Math.max(0, value - 1));
      setStats((current) =>
        current ? { ...current, totalCustomers: Math.max(0, current.totalCustomers - 1) } : current
      );
      setMessage(`Cliente ${data.email || selected.email} removido.`);
    } finally {
      setRemoving(false);
    }
  }

  async function purgeAllClients() {
    if (purging) return;
    setPurging(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/customers/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: purgeConfirm }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.message || data.error || "Não foi possível limpar os clientes.");
        return;
      }
      setPurgeConfirm("");
      setSelectedId(null);
      setMessage(
        `Base de clientes limpa. Mantido ${data.result?.keptEmail || "o admin"}. Removidas ${data.result?.removedAccounts ?? 0} contas.`
      );
      await load();
    } finally {
      setPurging(false);
    }
  }

  function exportCsv() {
    const rows = [
      ["Nome", "Email", "Telefone", "Tipo", "Auth", "Marketing", "Encomendas", "Desde"],
      ...customers.map((customer) => [
        customer.profile?.fullName || "",
        customer.email,
        phoneLabel(customer),
        customer.profile?.customerType || "",
        [customer.hasGoogle ? "Google" : "", customer.hasPassword ? "Password" : ""].filter(Boolean).join("+"),
        customer.profile?.marketingOptIn ? "Sim" : "Não",
        String(customer.orderCount),
        formatDate(customer.createdAt),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jhonny-clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (unauthorized) {
    return (
      <div className="rounded-3xl border border-line bg-white p-8">
        <p className="font-display text-2xl font-extrabold uppercase text-ink">Acesso restrito</p>
        <p className="mt-3 text-sm text-muted">
          Entra com uma conta admin (email em <code className="text-ink">ADMIN_EMAILS</code>) para ver e gerir clientes.
        </p>
        <a href="/conta" className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
          Ir para a conta
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Clientes", stats.totalCustomers],
            ["Novos (7 dias)", stats.newLast7Days],
            ["Google", stats.googleSignups],
            ["Marketing opt-in", stats.marketingOptIn],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-line pb-3">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
              <p className="font-display mt-2 text-3xl font-extrabold text-ink">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <form
          className="grid flex-1 gap-3 sm:grid-cols-[1.4fr_0.8fr_0.8fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Pesquisar nome, email, telefone…"
            className="rounded-2xl border border-line bg-white px-4 py-3"
          />
          <select
            value={auth}
            onChange={(event) => setAuth(event.target.value as typeof auth)}
            className="rounded-2xl border border-line bg-white px-4 py-3"
          >
            <option value="all">Todos os logins</option>
            <option value="google">Google</option>
            <option value="password">Password</option>
          </select>
          <select
            value={marketing}
            onChange={(event) => setMarketing(event.target.value as typeof marketing)}
            className="rounded-2xl border border-line bg-white px-4 py-3"
          >
            <option value="all">Marketing: todos</option>
            <option value="yes">Opt-in</option>
            <option value="no">Sem opt-in</option>
          </select>
          <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
            Filtrar
          </button>
        </form>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-full border border-line bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-ink"
        >
          Export CSV
        </button>
      </div>

      {message && <p className="rounded-xl bg-white p-3 text-sm text-muted">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
              {loading ? "A carregar…" : `${total} cliente(s)`}
            </p>
          </div>
          <div className="divide-y divide-line">
            {customers.map((customer) => {
              const active = customer.id === selectedId;
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedId(customer.id)}
                  className={`grid w-full gap-1 px-5 py-4 text-left transition hover:bg-cream/60 ${active ? "bg-cream" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-lg font-extrabold uppercase text-ink">
                      {customer.profile?.fullName || customer.username}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">{formatDate(customer.createdAt)}</p>
                  </div>
                  <p className="text-sm text-muted">{customer.email}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    <span>{phoneLabel(customer)}</span>
                    <span>{customerTypeLabels[customer.profile?.customerType || ""] || "—"}</span>
                    <span>{customer.hasGoogle ? "Google" : null}{customer.hasGoogle && customer.hasPassword ? " · " : null}{customer.hasPassword ? "Password" : null}</span>
                    <span>{customer.orderCount} enc.</span>
                    {customer.profile?.marketingOptIn ? <span className="text-ink">Marketing</span> : null}
                    {customer.role === "ADMIN" ? <span className="text-ink">Admin</span> : null}
                  </div>
                </button>
              );
            })}
            {!loading && customers.length === 0 && (
              <p className="px-5 py-10 text-sm text-muted">Nenhum cliente encontrado com estes filtros.</p>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-line bg-white p-6">
          {!selected ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Detalhe</p>
              <p className="font-display mt-3 text-2xl font-extrabold uppercase text-ink">Seleciona um cliente</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Vê contacto, tipo de cliente, preferências de marketing e atualiza os dados da conta.
              </p>
            </div>
          ) : (
            <form key={selected.id} onSubmit={saveSelected} className="grid gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Gerir cliente</p>
                <h2 className="font-display mt-2 text-3xl font-extrabold uppercase text-ink">
                  {selected.profile?.fullName || selected.username}
                </h2>
                <p className="mt-1 text-sm text-muted">{selected.email}</p>
              </div>

              <label className="grid gap-1 text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-muted">Nome</span>
                <input
                  name="fullName"
                  required
                  defaultValue={selected.profile?.fullName || ""}
                  className="rounded-2xl border border-line px-4 py-3"
                />
              </label>

              <div className="grid grid-cols-[0.45fr_1fr] gap-2">
                <label className="grid gap-1 text-sm">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">Indicativo</span>
                  <input
                    name="phoneCountryCode"
                    defaultValue={selected.profile?.phoneCountryCode || "+351"}
                    className="rounded-2xl border border-line px-4 py-3"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">Telefone</span>
                  <input
                    name="phone"
                    defaultValue={selected.profile?.phone || ""}
                    className="rounded-2xl border border-line px-4 py-3"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-muted">Tipo</span>
                <select
                  name="customerType"
                  defaultValue={selected.profile?.customerType || "SURFER"}
                  className="rounded-2xl border border-line px-4 py-3"
                >
                  {Object.entries(customerTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-muted">Papel</span>
                <select name="role" defaultValue={selected.role} className="rounded-2xl border border-line px-4 py-3">
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-muted">
                <input name="marketingOptIn" type="checkbox" defaultChecked={Boolean(selected.profile?.marketingOptIn)} />
                Marketing opt-in
              </label>

              <div className="rounded-2xl bg-cream px-4 py-3 text-xs leading-relaxed text-muted">
                <p>Username: {selected.username}</p>
                <p>
                  Login: {[selected.hasGoogle ? "Google" : null, selected.hasPassword ? "Password" : null].filter(Boolean).join(" · ") || "—"}
                </p>
                <p>
                  Odoo: {selected.profile?.odooSyncStatus || "—"}
                  {selected.profile?.odooPartnerId ? ` (#${selected.profile.odooPartnerId})` : ""}
                </p>
                <p>Encomendas: {selected.orderCount}</p>
              </div>

              <button className="rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
                Guardar alterações
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={() => void removeSelected()}
                className="rounded-full border border-line px-5 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-cream disabled:opacity-60"
              >
                {removing ? "A remover…" : "Remover cliente"}
              </button>
            </form>
          )}
        </aside>
      </div>

      <div className="rounded-3xl border border-line bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Limpar base de clientes</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Remove todas as contas registadas e dados de cliente, e mantém só{" "}
          <code className="text-ink">tiagopaixaodomingues@gmail.com</code> como admin.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={purgeConfirm}
            onChange={(event) => setPurgeConfirm(event.target.value)}
            placeholder="Escreve o email do admin para confirmar"
            className="min-w-0 flex-1 rounded-2xl border border-line px-4 py-3"
          />
          <button
            type="button"
            disabled={purging}
            onClick={() => void purgeAllClients()}
            className="rounded-full border border-line px-5 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-cream disabled:opacity-60"
          >
            {purging ? "A limpar…" : "Remover todos os clientes"}
          </button>
        </div>
      </div>
    </div>
  );
}
