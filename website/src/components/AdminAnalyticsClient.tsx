"use client";

import { useCallback, useEffect, useState } from "react";

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
  byCountry: Bucket[];
  byCity: Bucket[];
  byPath: Bucket[];
  byDay: Bucket[];
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

function BarList({ title, rows }: { title: string; rows: Bucket[] }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{title}</p>
      <div className="mt-5 grid gap-3">
        {rows.length === 0 && <p className="text-sm text-muted">Sem dados ainda.</p>}
        {rows.map((row) => (
          <div key={row.key} className="grid gap-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-semibold text-ink">{row.key}</span>
              <span className="text-muted">{row.count}</span>
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
  const [days, setDays] = useState(30);
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
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border-b border-line pb-3 pr-8">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">Pageviews</p>
            <p className="font-display mt-2 text-3xl font-extrabold text-ink">
              {loading ? "…" : summary?.totalViews ?? 0}
            </p>
          </div>
          <div className="border-b border-line pb-3 pr-8">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">Países</p>
            <p className="font-display mt-2 text-3xl font-extrabold text-ink">
              {loading ? "…" : summary?.uniqueCountries ?? 0}
            </p>
          </div>
          <div className="border-b border-line pb-3">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">Janela</p>
            <p className="font-display mt-2 text-3xl font-extrabold text-ink">{days}d</p>
          </div>
        </div>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-2xl border border-line bg-white px-4 py-3"
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>
      </div>

      {message && <p className="rounded-xl bg-white p-3 text-sm text-muted">{message}</p>}

      <p className="max-w-3xl text-sm leading-relaxed text-muted">
        Dados first-party (país/cidade via Vercel, GPS só com consentimento de analytics).
        Cupões contam apenas compras pagas.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarList title="Cupões usados em compras" rows={summary?.coupons || []} />
        <BarList title="Localização (GPS vs IP)" rows={summary?.byLocationSource || []} />
        <BarList title="Por país" rows={summary?.byCountry || []} />
        <BarList title="Por cidade" rows={summary?.byCity || []} />
        <BarList title="Páginas mais vistas" rows={summary?.byPath || []} />
        <BarList title="Por dia" rows={summary?.byDay || []} />
      </div>

      {(summary?.coupons?.length || 0) > 0 && (
        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Cupões — detalhe</p>
          </div>
          <div className="divide-y divide-line">
            {summary?.coupons?.map((coupon) => (
              <div key={coupon.code} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-semibold text-ink">{coupon.code} · {coupon.label}</p>
                  <p className="text-sm text-muted">
                    {coupon.count} compras · −{coupon.percentOff}% · {((coupon.discountCents || 0) / 100).toFixed(2)} €
                  </p>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  {new Date(coupon.lastUsed).toLocaleString("pt-PT")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Visitas recentes</p>
        </div>
        <div className="divide-y divide-line">
          {(summary?.recent || []).map((visit, index) => (
            <div key={`${visit.createdAt}-${index}`} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="font-semibold text-ink">{visit.path}</p>
                <p className="text-sm text-muted">
                  {[visit.city, visit.country].filter(Boolean).join(", ") || "Local desconhecido"}
                  {visit.locationSource ? ` · ${visit.locationSource}` : ""}
                  {visit.referrer ? ` · ref ${visit.referrer}` : ""}
                </p>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
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
