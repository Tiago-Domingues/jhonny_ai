"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/components/LanguageProvider";

/** Ungated 10% coupon handed out by the wheel. Seed with `npm run seed:spin-coupon`. */
export const SPIN_COUPON_CODE = "RODA10";

const SPIN_RESULT_KEY = "jss_spin_wheel_result_v1";
const SEGMENT_COUNT = 8;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
const FULL_TURNS = 5;
const SPIN_MS = 4600;

const INK = "#0d0d0d";
const CREAM = "#ebe4d6";

const CENTER = 100;
const WHEEL_RADIUS = 86;
const RING_RADIUS = 94;

function polar(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

/** Wedges are static geometry, so they are built once at module scope. */
const SEGMENTS = Array.from({ length: SEGMENT_COUNT }, (_, index) => {
  const start = -90 + index * SEGMENT_ANGLE;
  const mid = start + SEGMENT_ANGLE / 2;
  const from = polar(WHEEL_RADIUS, start);
  const to = polar(WHEEL_RADIUS, start + SEGMENT_ANGLE);
  const label = polar(WHEEL_RADIUS * 0.6, mid);
  // Keep labels on the left half from reading upside-down.
  const flipped = Math.cos((mid * Math.PI) / 180) < 0;

  return {
    index,
    dark: index % 2 === 0,
    path: `M ${CENTER} ${CENTER} L ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 0 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)} Z`,
    labelX: Number(label.x.toFixed(2)),
    labelY: Number(label.y.toFixed(2)),
    labelRotation: Number((flipped ? mid + 180 : mid).toFixed(2)),
  };
});

/** Bulbs sit on the wedge boundaries so the ring reads as aligned, not scattered. */
const BULBS = Array.from({ length: SEGMENT_COUNT }, (_, index) =>
  polar(RING_RADIUS, -90 + index * SEGMENT_ANGLE)
);

/**
 * Rotation that parks `index` under the pointer at 12 o'clock, always
 * travelling forwards so the wheel never appears to rewind between spins.
 */
function rotationForSegment(current: number, index: number) {
  const target = -SEGMENT_ANGLE * index - SEGMENT_ANGLE / 2;
  const currentMod = ((current % 360) + 360) % 360;
  const targetMod = ((target % 360) + 360) % 360;
  const delta = (targetMod - currentMod + 360) % 360;
  return current + FULL_TURNS * 360 + delta;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("jss-a11y-motion")
  );
}

const copy = {
  pt: {
    eyebrow: "Roda da sorte",
    title: "Gira e ganha",
    body: "Uma volta por visita. Gira a roda e leva o teu desconto para a próxima encomenda.",
    spin: "Girar a roda",
    spinning: "A girar…",
    wonTitle: "Ganhaste 10% de desconto",
    wonBody: "Usa o código no checkout e poupa na tua encomenda.",
    codeLabel: "O teu cupão",
    copyCode: "Copiar código",
    copied: "Código copiado",
    cta: "Ir para a loja",
    fineprint: "Um cupão por cliente. Não acumulável com outras campanhas.",
    close: "Fechar",
    wheelLabel: "Roda de prémios com 10% de desconto em cada fatia",
  },
  en: {
    eyebrow: "Wheel of fortune",
    title: "Spin & win",
    body: "One spin per visit. Give the wheel a turn and take your discount to the checkout.",
    spin: "Spin the wheel",
    spinning: "Spinning…",
    wonTitle: "You won 10% off",
    wonBody: "Use the code at checkout and save on your order.",
    codeLabel: "Your coupon",
    copyCode: "Copy code",
    copied: "Code copied",
    cta: "Shop now",
    fineprint: "One coupon per customer. Not combinable with other offers.",
    close: "Close",
    wheelLabel: "Prize wheel with 10% off on every slice",
  },
  zh: {
    eyebrow: "幸运转盘",
    title: "转动赢好礼",
    body: "每次来访可转动一次。转动转盘，把折扣带到结账页面。",
    spin: "转动转盘",
    spinning: "转动中…",
    wonTitle: "你赢得了 9 折优惠",
    wonBody: "结账时使用此优惠码即可享受折扣。",
    codeLabel: "你的优惠码",
    copyCode: "复制代码",
    copied: "已复制代码",
    cta: "前往商店",
    fineprint: "每位顾客限用一次，不可与其他活动叠加。",
    close: "关闭",
    wheelLabel: "每一格都是 9 折优惠的幸运转盘",
  },
} as const;

type Phase = "idle" | "spinning" | "won";

export function PrizeWheel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale } = useLanguage();
  const t = copy[locale];

  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);
  const [animateSpin, setAnimateSpin] = useState(false);
  const [copied, setCopied] = useState(false);
  const spinButtonRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWinnerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  // Restore an earlier win so re-opening shows the prize instead of a fresh spin.
  useEffect(() => {
    if (!open) return;
    const stored = window.sessionStorage.getItem(SPIN_RESULT_KEY);
    if (stored === null) return;
    const index = Number(stored);
    if (!Number.isInteger(index) || index < 0 || index >= SEGMENT_COUNT) return;
    setWinner(index);
    setPhase("won");
    setAnimateSpin(false);
    setRotation(rotationForSegment(0, index) - FULL_TURNS * 360);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && phase === "idle") spinButtonRef.current?.focus();
  }, [open, phase]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  const settle = useCallback(() => {
    const index = pendingWinnerRef.current;
    if (index === null) return;
    pendingWinnerRef.current = null;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    setPhase("won");
    setWinner(index);
    window.sessionStorage.setItem(SPIN_RESULT_KEY, String(index));
  }, []);

  function spin() {
    if (phase !== "idle") return;
    const index = Math.floor(Math.random() * SEGMENT_COUNT);
    pendingWinnerRef.current = index;

    if (prefersReducedMotion()) {
      setAnimateSpin(false);
      setRotation(rotationForSegment(rotation, index));
      settle();
      return;
    }

    setPhase("spinning");
    setAnimateSpin(true);
    setRotation(rotationForSegment(rotation, index));
    // A backgrounded tab never fires transitionend, so guarantee the reveal.
    settleTimerRef.current = setTimeout(settle, SPIN_MS + 150);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(SPIN_COUPON_CODE);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (!mounted || !open) return null;

  const won = phase === "won";

  return createPortal(
    <div
      className="jss-fade-in fixed inset-0 z-[80] flex items-center justify-center bg-ink/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-wheel-title"
      data-testid="prize-wheel"
    >
      <button
        type="button"
        aria-label={t.close}
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="jss-rise-in relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl shadow-black/40">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          data-testid="prize-wheel-close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          ×
        </button>

        <div className="flex flex-col items-center px-6 pb-7 pt-8 text-center sm:px-8">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-muted">
            {t.eyebrow}
          </p>
          <h2
            id="prize-wheel-title"
            className="font-display mt-2 text-3xl font-extrabold uppercase leading-none tracking-tight text-ink"
          >
            {won ? t.wonTitle : t.title}
          </h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            {won ? t.wonBody : t.body}
          </p>

          <div className="jss-rise-in jss-stagger-1 relative mt-6 h-60 w-60 sm:h-68 sm:w-68">
            {/* Grounding shadow so the wheel sits on the paper rather than floating. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-6 bottom-1 h-6 rounded-[50%] bg-ink/20 blur-md"
            />

            <div className={won || phase === "spinning" ? "" : "jss-wheel-idle"}>
              <div
                className={`jss-wheel-spinner ${animateSpin ? "jss-wheel-spinner--spinning" : ""}`}
                style={{ transform: `rotate(${rotation}deg)` }}
                onTransitionEnd={settle}
              >
                <svg viewBox="0 0 200 200" role="img" aria-label={t.wheelLabel}>
                  <circle cx={CENTER} cy={CENTER} r={98} fill={INK} />

                  {SEGMENTS.map((segment) => (
                    <path
                      key={segment.index}
                      d={segment.path}
                      fill={segment.dark ? INK : CREAM}
                      stroke={segment.dark ? "rgba(235,228,214,0.25)" : "rgba(13,13,13,0.12)"}
                      strokeWidth={0.75}
                    />
                  ))}

                  {winner !== null && (
                    <path
                      className="jss-wheel-win"
                      d={SEGMENTS[winner]!.path}
                      fill={SEGMENTS[winner]!.dark ? CREAM : INK}
                      pointerEvents="none"
                    />
                  )}

                  {SEGMENTS.map((segment) => (
                    <text
                      key={`label-${segment.index}`}
                      x={segment.labelX}
                      y={segment.labelY}
                      transform={`rotate(${segment.labelRotation} ${segment.labelX} ${segment.labelY})`}
                      textAnchor="middle"
                      fill={segment.dark ? CREAM : INK}
                      fontFamily="var(--font-montserrat), Helvetica Neue, Arial, sans-serif"
                      fontWeight={800}
                    >
                      <tspan x={segment.labelX} dy="-0.1em" fontSize={17}>
                        10%
                      </tspan>
                      <tspan x={segment.labelX} dy="1.05em" fontSize={8} letterSpacing="1.6">
                        OFF
                      </tspan>
                    </text>
                  ))}

                  {BULBS.map((bulb, index) => (
                    <circle
                      key={`bulb-${index}`}
                      cx={bulb.x}
                      cy={bulb.y}
                      r={2.6}
                      fill={CREAM}
                      opacity={0.9}
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* Hub sits outside the spinner so the Jhonny mark stays upright. */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-ink bg-cream shadow-md">
                <Logo type="mark" className="h-7 w-auto" />
              </span>
            </div>

            <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2">
              <svg
                viewBox="0 0 24 26"
                aria-hidden="true"
                className={`jss-wheel-pointer h-6 w-6 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] ${
                  won ? "jss-wheel-pointer--tick" : ""
                }`}
              >
                <path d="M12 25 L2 3 A 12 12 0 0 1 22 3 Z" fill={INK} />
                <circle cx="12" cy="7" r="2.6" fill={CREAM} />
              </svg>
            </div>
          </div>

          {won ? (
            <div className="jss-rise-in mt-6 w-full">
              <div className="rounded-2xl border border-dashed border-ink/25 bg-cream px-4 py-3 text-left">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">
                  {t.codeLabel}
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p
                    className="font-display text-2xl font-extrabold tracking-[0.12em] text-ink"
                    data-testid="prize-wheel-code"
                  >
                    {SPIN_COUPON_CODE}
                  </p>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-ink transition hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {copied ? t.copied : t.copyCode}
                  </button>
                </div>
              </div>

              <Link
                href="/loja"
                onClick={onClose}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {t.cta}
              </Link>

              <p className="mt-4 text-[0.7rem] leading-relaxed text-muted/90">{t.fineprint}</p>
            </div>
          ) : (
            <button
              ref={spinButtonRef}
              type="button"
              onClick={spin}
              disabled={phase === "spinning"}
              data-testid="prize-wheel-spin"
              className="jss-rise-in jss-stagger-2 mt-6 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {phase === "spinning" ? t.spinning : t.spin}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
