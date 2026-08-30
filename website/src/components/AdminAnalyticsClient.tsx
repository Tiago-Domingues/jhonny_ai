"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminDailyChart } from "@/components/AdminDailyChart";
import { formatEuro } from "@/lib/ecommerce/money";
import type { DailyMetrics } from "@/lib/ecommerce/analyticsDaily";

type Bucket = { key: string; count: number };
type CouponRow = Bucket & {
  code: string;
  label: string;
  percentOff: number;
  discountCents: number;
  lastUsed: string;
};

type Summary = {
  days: number;
  totalViews: number;
  uniqueCountries: number;
  allTimeSalesCents: number;
  allTimeOrderCount: number;
  byCountry: Bucket[];
  byCity: Bucket[];
  byPath: Bucket[];
  byDay: DailyMetrics[];
  byLocationSource?: Bucket[];
  coupons?: CouponRow[];
  recent: Array<{
    path: string;
    country: string | null;
    city: string | null;
    referrer: string | null;
    locationSource?: string | null;
    createdAt: string;
  }>;
};

function shortText(value: string, max = 64) {
  const trimmed = value.replace(/^https?:\/\//, "");
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function BarList({ title, rows }: { title: string; rows: Bucket[] }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-line bg-white p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{title}</p>
      <div className="mt-5 grid gap-3">
        {rows.length === 0 && <p className="text-sm text-muted">Sem dados ainda.</p>}
        {rows.map((row) => (
          <div key={row.key} className="grid min-w-0 gap-1">
            <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-semibold text-ink" title={row.key}>
                {shortText(row.key, 42)}
              </span>
              <span className="shrink-0 text-muted">{row.count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-cream">
              <div
                className="h-full max-w-full rounded-full bg-ink"
                style={{ width: `${Math.min(100, Math.max(0, (row.count / max) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAnalyticsClient() {
  const [days, setDays] = useState(90);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/analytics?days=${days}`);
      if (response.status === 401) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.message || data.error || "Não foi possível carregar analytics.");
        setSummary(null);
        setLoading(false);
        return;
      }
      setUnauthorized(false);
      setSummary(data);
    } catch {
      setMessage("Erro de rede ao carregar analytics.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

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
    <div className="grid min-w-0 max-w-full gap-8 overflow-x-hidden">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="grid min-w-0 w-full flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="border-b border-line pb-3 pr-6">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">Pageviews</p>
            <p className="font-display mt-2 text-3xl font-extrabold text-ink">
              {loading ? "…" : summary?.totalViews ?? 0}
            </p>
          </div>
          <div className="border-b border-line pb-3 pr-6">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">Países</p>
            <p className="font-display mt-2 text-3xl font-extrabold text-ink">
              {loading ? "…" : summary?.uniqueCountries ?? 0}
            </p>
          </div>
          <div className="border-b border-line pb-3 pr-6">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">Janela</p>
            <p className="font-display mt-2 text-3xl font-extrabold text-ink">{days}d</p>
          </div>
          <div className="border-b border-line pb-3 pr-6">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">Vendas totais</p>
            <p className="font-display mt-2 text-3xl font-extrabold text-ink">
              {loading ? "…" : formatEuro(summary?.allTimeSalesCents || 0)}
            </p>
          </div>
          <div className="border-b border-line pb-3">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">Encomendas</p>
            <p className="font-display mt-2 text-3xl font-extrabold text-ink">
              {loading ? "…" : summary?.allTimeOrderCount ?? 0}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="rounded-2xl border border-line bg-white px-4 py-3"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
          <a
            href={`/api/admin/analytics/export.csv?days=${days}`}
            className="rounded-full border border-line bg-white px-5 py-3 text-center text-sm font-bold uppercase tracking-wide text-ink"
          >
            Export CSV
          </a>
        </div>
      </div>

      {message && <p className="rounded-xl bg-white p-3 text-sm text-muted">{message}</p>}

      <p className="max-w-3xl text-sm leading-relaxed text-muted">
        Dados first-party (país/cidade via Vercel, GPS só com consentimento de analytics).
        Cupões e a janela 7/30/90 aplicam-se às tabelas. Vendas totais e o gráfico são desde 1 Jul 2026 / day 0.
        O CSV guarda o gráfico diário, tabelas da janela e visitas recentes.
      </p>

      <AdminDailyChart byDay={summary?.byDay || []} />

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <BarList title="Cupões usados em compras" rows={summary?.coupons || []} />
        <BarList title="Localização (GPS vs IP)" rows={summary?.byLocationSource || []} />
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <BarList title="Por país" rows={summary?.byCountry || []} />
        <BarList title="Por cidade" rows={summary?.byCity || []} />
        <BarList title="Páginas mais vistas" rows={summary?.byPath || []} />
      </div>

      {(summary?.coupons?.length || 0) > 0 && (
        <div className="min-w-0 overflow-hidden rounded-3xl border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Cupões — detalhe</p>
          </div>
          <div className="divide-y divide-line">
            {summary?.coupons?.map((coupon) => (
              <div key={coupon.code} className="grid min-w-0 gap-1 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{coupon.code} · {coupon.label}</p>
                  <p className="text-sm text-muted">
                    {coupon.count} compras · −{coupon.percentOff}% · {((coupon.discountCents || 0) / 100).toFixed(2)} €
                  </p>
                </div>
                <p className="shrink-0 text-xs font-bold uppercase tracking-wide text-muted">
                  {new Date(coupon.lastUsed).toLocaleString("pt-PT")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="min-w-0 overflow-hidden rounded-3xl border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Visitas recentes</p>
        </div>
        <div className="divide-y divide-line">
          {(summary?.recent || []).map((visit, index) => (
            <div key={`${visit.createdAt}-${index}`} className="grid min-w-0 gap-1 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink" title={visit.path}>
                  {shortText(visit.path, 72)}
                </p>
                <p className="truncate text-sm text-muted" title={[visit.city, visit.country, visit.referrer].filter(Boolean).join(" · ")}>
                  {[visit.city, visit.country].filter(Boolean).join(", ") || "Local desconhecido"}
                  {visit.locationSource ? ` · ${visit.locationSource}` : ""}
                  {visit.referrer ? ` · ref ${shortText(visit.referrer, 40)}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-xs font-bold uppercase tracking-wide text-muted">
                {new Date(visit.createdAt).toLocaleString("pt-PT")}
              </p>
            </div>
          ))}
          {!loading && (summary?.recent.length || 0) === 0 && (
            <p className="px-5 py-10 text-sm text-muted">Ainda sem pageviews gravados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
