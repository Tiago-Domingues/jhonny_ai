"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  bucketDailyMetrics,
  padFutureDays,
  periodLabel,
  todayLisbonDateKey,
  type ChartBucket,
  type DailyMetrics,
} from "@/lib/ecommerce/analyticsDaily";
import { formatEuro } from "@/lib/ecommerce/money";

const HEIGHT = 220;
const COL_WIDTH = 36;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const FUTURE_DAYS = 14;

export function AdminDailyChart({ byDay }: { byDay: DailyMetrics[] }) {
  const [bucket, setBucket] = useState<ChartBucket>("day");
  const [selected, setSelected] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const todayKey = todayLisbonDateKey();
  const series = useMemo(() => padFutureDays(byDay, FUTURE_DAYS, todayKey), [byDay, todayKey]);
  const rows = useMemo(() => bucketDailyMetrics(series, bucket), [series, bucket]);
  const todayIndex = useMemo(() => {
    if (bucket === "day") {
      const index = rows.findIndex((row) => row.key === todayKey);
      return index >= 0 ? index : Math.max(0, rows.length - 1 - FUTURE_DAYS);
    }
    const index = rows.findIndex((row, i) => {
      const next = rows[i + 1];
      return row.key <= todayKey && (!next || next.key > todayKey);
    });
    return index >= 0 ? index : Math.max(0, rows.length - 1);
  }, [bucket, rows, todayKey]);

  useEffect(() => {
    setSelected(todayIndex);
    const node = scroller.current;
    const id = window.requestAnimationFrame(() => {
      if (!node) return;
      const todayX = todayIndex * COL_WIDTH;
      node.scrollLeft = Math.max(0, todayX - node.clientWidth * 0.65);
    });
    return () => window.cancelAnimationFrame(id);
  }, [bucket, todayIndex, rows.length]);

  const maxes = useMemo(
    () => ({
      views: Math.max(...rows.map((row) => row.views), 1),
      newClients: Math.max(...rows.map((row) => row.newClients), 1),
      salesCents: Math.max(...rows.map((row) => row.salesCents), 1),
    }),
    [rows]
  );

  const selectedRow = rows[selected] || rows[todayIndex] || rows[rows.length - 1];
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const width = Math.max(rows.length * COL_WIDTH, 320);

  function move(delta: number) {
    setSelected((current) => Math.min(rows.length - 1, Math.max(0, current + delta)));
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-line bg-white p-6">
      <div className="grid gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Por dia</p>
          <p className="mt-2 text-sm text-muted">
            Hoje ao centro-direita. Esquerda = passado (desde 1 Jul 2026). Direita = futuro.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["day", "Daily"],
              ["week", "Weekly avg"],
              ["month", "Monthly avg"],
              ["90d", "90-day avg"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setBucket(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                bucket === value ? "bg-ink text-white" : "border border-line text-ink hover:bg-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wide text-muted">
        <span className="inline-flex items-center gap-2">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-ink" /> Views max {Math.round(maxes.views)}
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#8a8175]" /> Clients max {maxes.newClients.toFixed(1)}
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#c4a574]" /> Sales max {formatEuro(Math.round(maxes.salesCents))}
        </span>
      </div>

      {selectedRow && (
        <p className="mt-3 break-words text-sm text-ink">
          <span className="font-semibold">{periodLabel(selectedRow, bucket)}</span>
          {selected === todayIndex && bucket === "day" ? " · hoje" : ""}
          {" · "}
          {Math.round(selectedRow.views)} views · {selectedRow.newClients.toFixed(1)} new clients ·{" "}
          {formatEuro(Math.round(selectedRow.salesCents))} · {selectedRow.salesCount} orders
        </p>
      )}

      <div
        ref={scroller}
        className="mt-4 max-w-full min-w-0 overflow-x-auto overscroll-x-contain"
        tabIndex={0}
        role="img"
        aria-label="Daily stacked views, new clients, and sales"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
      >
        <svg width={width} height={HEIGHT} className="block max-w-none">
          {rows.map((row, index) => {
            const x = index * COL_WIDTH + 8;
            const viewsH = (row.views / maxes.views) * (innerHeight / 3);
            const clientsH = (row.newClients / maxes.newClients) * (innerHeight / 3);
            const salesH = (row.salesCents / maxes.salesCents) * (innerHeight / 3);
            const base = HEIGHT - PAD_BOTTOM;
            const active = index === selected;
            const isToday = index === todayIndex;
            const isFuture = bucket === "day" ? row.key > todayKey : index > todayIndex;
            return (
              <g
                key={`${row.key}-${index}`}
                className="cursor-pointer"
                onClick={() => setSelected(index)}
                onMouseEnter={() => setSelected(index)}
                opacity={isFuture ? 0.35 : 1}
              >
                <rect
                  x={x - 4}
                  y={PAD_TOP}
                  width={COL_WIDTH - 8}
                  height={innerHeight}
                  fill={active ? "#f3efe6" : "transparent"}
                  rx={6}
                />
                {isToday && (
                  <rect x={x - 4} y={PAD_TOP} width={2} height={innerHeight} fill="#111111" />
                )}
                <rect x={x} y={base - viewsH} width={20} height={Math.max(viewsH, 0)} fill="#111111" />
                <rect x={x} y={base - viewsH - clientsH} width={20} height={Math.max(clientsH, 0)} fill="#8a8175" />
                <rect
                  x={x}
                  y={base - viewsH - clientsH - salesH}
                  width={20}
                  height={Math.max(salesH, 0)}
                  fill="#c4a574"
                />
                {(active || isToday) && (
                  <text x={x + 10} y={HEIGHT - 8} textAnchor="middle" fontSize="9" fill="#666">
                    {isToday && bucket === "day" ? "hoje" : row.key.slice(-5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
