"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/LanguageProvider";
import { WHEEL_LAYOUT, WHEEL_SEGMENT_COUNT } from "@/lib/ecommerce/prizeWheel";

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENT_COUNT;
const FULL_TURNS = 5;
const SPIN_MS = 4600;
const JACKPOT_PERCENT = 20;

const INK = "#0d0d0d";
const CREAM = "#ebe4d6";
/** The one warm accent in the brand, borrowed from the surfboard gradient. */
const GOLD = "#f7d46f";

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
const SEGMENTS = WHEEL_LAYOUT.map((percent, index) => {
  const start = -90 + index * SEGMENT_ANGLE;
  const mid = start + SEGMENT_ANGLE / 2;
  const from = polar(WHEEL_RADIUS, start);
  const to = polar(WHEEL_RADIUS, start + SEGMENT_ANGLE);
  const label = polar(WHEEL_RADIUS * 0.62, mid);
  // Keep labels on the left half from reading upside-down.
  const flipped = Math.cos((mid * Math.PI) / 180) < 0;
  const jackpot = percent === JACKPOT_PERCENT;
  const dark = index % 2 === 0;

  return {
    index,
    percent,
    jackpot,
    dark,
    fill: jackpot ? GOLD : dark ? INK : CREAM,
    textFill: jackpot ? INK : dark ? CREAM : INK,
    path: `M ${CENTER} ${CENTER} L ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 0 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)} Z`,
    labelX: Number(label.x.toFixed(2)),
    labelY: Number(label.y.toFixed(2)),
    labelRotation: Number((flipped ? mid + 180 : mid).toFixed(2)),
  };
});

/** Bulbs sit on the wedge boundaries so the ring reads as aligned, not scattered. */
const BULBS = Array.from({ length: WHEEL_SEGMENT_COUNT }, (_, index) =>
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
    body: "Uma volta por mês. Gira a roda e leva o teu desconto para a próxima encomenda.",
    spin: "Girar a roda",
    spinning: "A girar…",
    wonTitle: "Ganhaste {percent}% de desconto",
    wonBody: "Usa o código no checkout e poupa na tua encomenda.",
    usedTitle: "Já giraste este mês",
    usedBody: "Volta no próximo mês para ganhar mais descontos. Este é o cupão que ganhaste:",
    spinAgain: "Girar outra vez",
    signInTitle: "Só para membros",
    signInBody: "Cria conta ou entra para girar a roda e ganhar até 20% de desconto todos os meses.",
    signInCta: "Entrar ou registar",
    codeLabel: "O teu cupão",
    copyCode: "Copiar código",
    copied: "Código copiado",
    cta: "Ir para a loja",
    fineprint: "Um cupão por mês, só para a tua conta. Não acumulável com outras campanhas.",
    close: "Fechar",
    loading: "A carregar…",
    wheelLabel: "Roda de prémios com cupões de 5%, 10% e 20% de desconto",
  },
  en: {
    eyebrow: "Wheel of fortune",
    title: "Spin & win",
    body: "One spin a month. Give the wheel a turn and take your discount to the checkout.",
    spin: "Spin the wheel",
    spinning: "Spinning…",
    wonTitle: "You won {percent}% off",
    wonBody: "Use the code at checkout and save on your order.",
    usedTitle: "You already spun this month",
    usedBody: "Come back next month for more discounts. Here is the coupon you won:",
    spinAgain: "Spin again",
    signInTitle: "Members only",
    signInBody: "Sign in or create an account to spin the wheel and win up to 20% off every month.",
    signInCta: "Sign in or register",
    codeLabel: "Your coupon",
    copyCode: "Copy code",
    copied: "Code copied",
    cta: "Shop now",
    fineprint: "One coupon a month, tied to your account. Not combinable with other offers.",
    close: "Close",
    loading: "Loading…",
    wheelLabel: "Prize wheel with 5%, 10% and 20% off coupons",
  },
  zh: {
    eyebrow: "幸运转盘",
    title: "转动赢好礼",
    body: "每月可转动一次。转动转盘，把折扣带到结账页面。",
    spin: "转动转盘",
    spinning: "转动中…",
    wonTitle: "你赢得了 {percent}% 折扣",
    wonBody: "结账时使用此优惠码即可享受折扣。",
    usedTitle: "本月已转动过",
    usedBody: "下个月再来赢取更多折扣。这是你已获得的优惠码：",
    spinAgain: "再转一次",
    signInTitle: "仅限会员",
    signInBody: "登录或注册即可转动转盘，每月最高赢取 20% 折扣。",
    signInCta: "登录或注册",
    codeLabel: "你的优惠码",
    copyCode: "复制代码",
    copied: "已复制代码",
    cta: "前往商店",
    fineprint: "每月一张，仅限本人账户使用，不可与其他活动叠加。",
    close: "关闭",
    loading: "加载中…",
    wheelLabel: "含 5%、10% 和 20% 折扣的幸运转盘",
  },
} as const;

type Prize = { percent: number; code: string; segmentIndex: number };
type Phase = "loading" | "signedOut" | "ready" | "spinning" | "result";

type WheelStatusResponse = {
  signedIn?: boolean;
  eligible?: boolean;
  prize?: Prize | null;
};

/**
 * Members-only prize wheel.
 *
 * The prize is drawn by POST /api/wheel/spin, never here: the wheel awards up
 * to 20%, so a client-side draw would let anyone pick their own prize. This
 * component only animates to the wedge the server chose.
 */
export function PrizeWheel({ onClose }: { onClose: () => void }) {
  const { locale } = useLanguage();
  const t = copy[locale];

  const [phase, setPhase] = useState<Phase>("loading");
  const [eligible, setEligible] = useState(false);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [awardedNow, setAwardedNow] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [landedOn, setLandedOn] = useState<number | null>(null);
  const [animateSpin, setAnimateSpin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hubSrc, setHubSrc] = useState("/brand/jhonny-character-cut.png");

  const spinButtonRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ segmentIndex: number; awarded: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/wheel/status", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: WheelStatusResponse | null) => {
        if (!data || data.signedIn === false) {
          setPhase("signedOut");
          return;
        }
        if (data.prize) {
          setPrize(data.prize);
          setLandedOn(data.prize.segmentIndex);
          setRotation(rotationForSegment(0, data.prize.segmentIndex) - FULL_TURNS * 360);
        }
        setEligible(Boolean(data.eligible));
        setPhase(data.eligible ? "ready" : "result");
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhase("signedOut");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (phase === "ready") spinButtonRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  const settle = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    setLandedOn(pending.segmentIndex);
    setAwardedNow(pending.awarded);
    setPhase("result");
  }, []);

  function runSpin(segmentIndex: number, awarded: boolean) {
    pendingRef.current = { segmentIndex, awarded };

    if (prefersReducedMotion()) {
      setAnimateSpin(false);
      setRotation((current) => rotationForSegment(current, segmentIndex));
      settle();
      return;
    }

    setPhase("spinning");
    setAnimateSpin(true);
    setRotation((current) => rotationForSegment(current, segmentIndex));
    // A backgrounded tab never fires transitionend, so guarantee the reveal.
    settleTimerRef.current = setTimeout(settle, SPIN_MS + 150);
  }

  async function spin() {
    if (phase === "spinning" || phase === "loading") return;
    setError(null);

    // Already spent this month: the wheel still turns, but purely for show.
    if (!eligible) {
      runSpin(Math.floor(Math.random() * WHEEL_SEGMENT_COUNT), false);
      return;
    }

    setPhase("spinning");
    try {
      const response = await fetch("/api/wheel/spin", { method: "POST" });
      const data = (await response.json()) as WheelStatusResponse & { message?: string };
      if (!response.ok || !data.prize) {
        setPhase(prize ? "result" : "ready");
        setError(data.message || "Could not spin the wheel. Please try again.");
        return;
      }
      setPrize(data.prize);
      setEligible(false);
      runSpin(data.prize.segmentIndex, true);
    } catch {
      setPhase(prize ? "result" : "ready");
      setError("Could not spin the wheel. Please try again.");
    }
  }

  async function copyCode() {
    if (!prize) return;
    try {
      await navigator.clipboard.writeText(prize.code);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const showingResult = phase === "result";
  const highlight = showingResult ? landedOn : null;

  const heading = (() => {
    if (phase === "signedOut") return t.signInTitle;
    if (showingResult && awardedNow && prize) {
      return t.wonTitle.replace("{percent}", String(prize.percent));
    }
    if (showingResult) return t.usedTitle;
    return t.title;
  })();

  const blurb = (() => {
    if (phase === "signedOut") return t.signInBody;
    if (showingResult && awardedNow) return t.wonBody;
    if (showingResult) return t.usedBody;
    return t.body;
  })();

  return createPortal(
    <div
      className="jss-fade-in fixed inset-0 z-[80] flex items-center justify-center bg-ink/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-wheel-title"
      data-testid="prize-wheel"
      data-phase={phase}
    >
      <button
        type="button"
        aria-label={t.close}
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div
        data-testid="prize-wheel-card"
        className="jss-rise-in relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-paper shadow-2xl shadow-black/40"
      >
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
            {heading}
          </h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{blurb}</p>

          <div
            className={`jss-rise-in jss-stagger-1 relative mt-6 h-60 w-60 transition-opacity sm:h-68 sm:w-68 ${
              phase === "signedOut" ? "opacity-60" : ""
            }`}
          >
            {/* Grounding shadow so the wheel sits on the paper rather than floating. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-6 bottom-1 h-6 rounded-[50%] bg-ink/20 blur-md"
            />

            <div className={phase === "ready" ? "jss-wheel-idle" : ""}>
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
                      fill={segment.fill}
                      stroke={segment.dark ? "rgba(235,228,214,0.25)" : "rgba(13,13,13,0.12)"}
                      strokeWidth={0.75}
                    />
                  ))}

                  {highlight !== null && SEGMENTS[highlight] && (
                    <>
                      {/* The flash celebrates a win as it lands. Reopening a
                          prize won days ago only gets the outline. */}
                      {awardedNow && (
                        <path
                          className="jss-wheel-win"
                          d={SEGMENTS[highlight]!.path}
                          fill={SEGMENTS[highlight]!.dark ? CREAM : INK}
                          pointerEvents="none"
                        />
                      )}
                      <path
                        className="jss-wheel-win-outline"
                        d={SEGMENTS[highlight]!.path}
                        fill="none"
                        stroke={GOLD}
                        strokeWidth={3}
                        strokeLinejoin="round"
                        pointerEvents="none"
                      />
                    </>
                  )}

                  {SEGMENTS.map((segment) => (
                    <text
                      key={`label-${segment.index}`}
                      x={segment.labelX}
                      y={segment.labelY}
                      transform={`rotate(${segment.labelRotation} ${segment.labelX} ${segment.labelY})`}
                      textAnchor="middle"
                      fill={segment.textFill}
                      fontFamily="var(--font-montserrat), Helvetica Neue, Arial, sans-serif"
                      fontWeight={800}
                    >
                      <tspan x={segment.labelX} dy="-0.1em" fontSize={segment.jackpot ? 16 : 14}>
                        {segment.percent}%
                      </tspan>
                      <tspan x={segment.labelX} dy="1.05em" fontSize={7} letterSpacing="1.4">
                        OFF
                      </tspan>
                    </text>
                  ))}

                  {BULBS.map((bulb, index) => (
                    <circle
                      key={`bulb-${index}`}
                      cx={bulb.x}
                      cy={bulb.y}
                      r={2.4}
                      fill={CREAM}
                      opacity={0.9}
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* Hub sits outside the spinner so Jhonny stays upright while it turns. */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-ink bg-cream shadow-md">
                <Image
                  src={hubSrc}
                  alt=""
                  width={72}
                  height={96}
                  onError={() => setHubSrc("/brand/jhonny-character-cut.svg")}
                  className="h-12 w-auto object-contain"
                />
              </span>
            </div>

            {/* Cream on the ink rim: an ink pointer would vanish into the ring. */}
            <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2">
              <svg
                viewBox="0 0 24 27"
                aria-hidden="true"
                className={`jss-wheel-pointer h-8 w-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] ${
                  showingResult ? "jss-wheel-pointer--tick" : ""
                }`}
              >
                <path
                  d="M12 26 L2.5 4 A 11 11 0 0 1 21.5 4 Z"
                  fill={CREAM}
                  stroke={INK}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="8" r="2.4" fill={INK} />
              </svg>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-xs font-semibold text-ink" role="alert">
              {error}
            </p>
          )}

          {phase === "signedOut" ? (
            <Link
              href="/conta"
              onClick={onClose}
              data-testid="prize-wheel-signin"
              className="jss-rise-in jss-stagger-2 mt-6 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {t.signInCta}
            </Link>
          ) : (
            <>
              {showingResult && prize && (
                <div className="jss-rise-in mt-6 w-full">
                  <div className="rounded-2xl border border-dashed border-ink/25 bg-cream px-4 py-3 text-left">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">
                      {t.codeLabel}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <p
                        className="font-display text-xl font-extrabold tracking-[0.1em] text-ink"
                        data-testid="prize-wheel-code"
                      >
                        {prize.code}
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
                </div>
              )}

              <button
                ref={spinButtonRef}
                type="button"
                onClick={spin}
                disabled={phase === "spinning" || phase === "loading"}
                data-testid="prize-wheel-spin"
                data-awards={eligible ? "true" : "false"}
                className={`jss-rise-in jss-stagger-2 mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-xs font-bold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  showingResult
                    ? "border border-line bg-white text-ink hover:bg-cream"
                    : "bg-ink text-white hover:bg-ink-soft"
                }`}
              >
                {phase === "loading"
                  ? t.loading
                  : phase === "spinning"
                    ? t.spinning
                    : showingResult
                      ? t.spinAgain
                      : t.spin}
              </button>

              <p className="mt-4 text-[0.7rem] leading-relaxed text-muted/90">{t.fineprint}</p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
