"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  bucketDailyMetrics,
  periodLabel,
  type ChartBucket,
  type DailyMetrics,
} from "@/lib/ecommerce/analyticsDaily";
import { formatEuro } from "@/lib/ecommerce/money";

const HEIGHT = 220;
const COL_WIDTH = 36;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

export function AdminDailyChart({ byDay }: { byDay: DailyMetrics[] }) {
  const [bucket, setBucket] = useState<ChartBucket>("day");
  const [selected, setSelected] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => bucketDailyMetrics(byDay, bucket), [byDay, bucket]);

  useEffect(() => {
    setSelected(Math.max(0, rows.length - 1));
    const node = scroller.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, [bucket, rows.length]);

  const maxes = useMemo(
    () => ({
      views: Math.max(...rows.map((row) => row.views), 1),
      newClients: Math.max(...rows.map((row) => row.newClients), 1),
      salesCents: Math.max(...rows.map((row) => row.salesCents), 1),
    }),
    [rows]
  );

  const selectedRow = rows[selected] || rows[rows.length - 1];
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const width = Math.max(rows.length * COL_WIDTH, 320);

  function move(delta: number) {
    setSelected((current) => Math.min(rows.length - 1, Math.max(0, current + delta)));
  }

  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Por dia</p>
          <p className="mt-2 text-sm text-muted">
            Stacked columns from 1 Jul 2026. Each series is scaled to its own max.
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
        <p className="mt-3 text-sm text-ink">
          <span className="font-semibold">{periodLabel(selectedRow, bucket)}</span>
          {" · "}
          {Math.round(selectedRow.views)} views · {selectedRow.newClients.toFixed(1)} new clients ·{" "}
          {formatEuro(Math.round(selectedRow.salesCents))} · {selectedRow.salesCount} orders
        </p>
      )}

      <div
        ref={scroller}
        className="mt-4 overflow-x-auto"
        tabIndex={0}
        role="img"
        aria-label="Daily stacked views, new clients, and sales"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
      >
        <svg width={width} height={HEIGHT} className="block">
          {rows.map((row, index) => {
            const x = index * COL_WIDTH + 8;
            const viewsH = (row.views / maxes.views) * (innerHeight / 3);
            const clientsH = (row.newClients / maxes.newClients) * (innerHeight / 3);
            const salesH = (row.salesCents / maxes.salesCents) * (innerHeight / 3);
            const base = HEIGHT - PAD_BOTTOM;
            const active = index === selected;
            return (
              <g
                key={`${row.key}-${index}`}
                className="cursor-pointer"
                onClick={() => setSelected(index)}
                onMouseEnter={() => setSelected(index)}
              >
                <rect
                  x={x - 4}
                  y={PAD_TOP}
                  width={COL_WIDTH - 8}
                  height={innerHeight}
                  fill={active ? "#f3efe6" : "transparent"}
                  rx={6}
                />
                <rect x={x} y={base - viewsH} width={20} height={Math.max(viewsH, 0)} fill="#111111" />
                <rect x={x} y={base - viewsH - clientsH} width={20} height={Math.max(clientsH, 0)} fill="#8a8175" />
                <rect
                  x={x}
                  y={base - viewsH - clientsH - salesH}
                  width={20}
                  height={Math.max(salesH, 0)}
                  fill="#c4a574"
                />
                {active && (
                  <text x={x + 10} y={HEIGHT - 8} textAnchor="middle" fontSize="9" fill="#666">
                    {row.key.slice(-5)}
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
