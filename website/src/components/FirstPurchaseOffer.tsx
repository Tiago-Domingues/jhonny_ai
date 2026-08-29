"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/components/LanguageProvider";
import { PrizeWheel } from "@/components/PrizeWheel";
import { RibbonSurfer } from "@/components/RibbonSurfer";
import { storefrontGetJson } from "@/lib/storefrontFetch";

const SESSION_DISMISSED_KEY = "jss_welcome_offer_dismissed_v1";
const RIBBON_HIDDEN_KEY = "jss_welcome_ribbon_hidden_v1";
/** Stops the monthly wheel prompt reopening on every homepage visit in one session. */
const WHEEL_PROMPTED_KEY = "jss_wheel_prompted_v1";
const COUPON_CODE = "JHONNY10";
const SHOW_AFTER_MS = 7000;
const RIBBON_ROTATE_MS = 7000;
const RIBBON_SLIDES = [
  ["Join", "the", "family"],
  ["Get", "special", "discounts"],
  ["Stay", "updated"],
] as const;

const copy = {
  pt: {
    eyebrow: "Oferta de boas-vindas",
    title: "Ganha 10% na primeira compra",
    body: "Cria a tua conta Jhonny Surf Store e usa o cupão na primeira encomenda online.",
    codeLabel: "O teu cupão",
    copied: "Código copiado",
    copyCode: "Copiar código",
    cta: "Registar e poupar 10%",
    dismiss: "Agora não",
    fineprint: "Válido para a primeira compra com conta registada. Não acumulável com outras campanhas.",
    ribbon: "Join the family",
  },
  en: {
    eyebrow: "Welcome offer",
    title: "Get 10% off your first purchase",
    body: "Create your Jhonny Surf Store account and apply the coupon on your first online order.",
    codeLabel: "Your coupon",
    copied: "Code copied",
    copyCode: "Copy code",
    cta: "Register & save 10%",
    dismiss: "Not now",
    fineprint: "Valid for the first purchase with a registered account. Not combinable with other offers.",
    ribbon: "Join the family",
  },
  zh: {
    eyebrow: "欢迎优惠",
    title: "首次购物立减 10%",
    body: "创建你的 Jhonny Surf Store 账户，并在首次线上订单中使用优惠码。",
    codeLabel: "你的优惠码",
    copied: "已复制代码",
    copyCode: "复制代码",
    cta: "注册并立省 10%",
    dismiss: "稍后再说",
    fineprint: "仅限注册账户首次购买使用，不可与其他活动叠加。",
    ribbon: "Join the family",
  },
} as const;

function hasConsentCookie() {
  return typeof document !== "undefined" && document.cookie.includes("jss_consent=");
}

/**
 * Keep the corner tab flush with the *visible* page bottom.
 *
 * `position: fixed; bottom: 0` is relative to the layout viewport. On iOS
 * Safari that can be the large viewport, so the tab would sit under the
 * toolbar. Raise by `innerHeight - visualBottom` only — that is the bottom
 * chrome. Do not set `top` from visualViewport (that painted under Safari
 * with viewport-fit: cover) and do not use `100lvh - 100dvh` (top + bottom
 * chrome, which parked the triangle over the product cards).
 */
function pinRibbonToVisibleBottom(el: HTMLElement) {
  const vv = window.visualViewport;
  el.style.top = "auto";
  el.style.right = "auto";

  if (!vv) {
    el.style.left = "0px";
    el.style.bottom = "0px";
    return;
  }

  const visualBottom = vv.offsetTop + vv.height;
  const raise = Math.max(0, window.innerHeight - visualBottom);
  el.style.left = `${Math.round(vv.offsetLeft)}px`;
  el.style.bottom = `${Math.round(raise)}px`;
}

export function FirstPurchaseOffer() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [open, setOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [ribbonVisible, setRibbonVisible] = useState(false);
  const [ribbonSlide, setRibbonSlide] = useState(0);
  const [ribbonTheme, setRibbonTheme] = useState<"dark" | "light">("dark");
  const [copied, setCopied] = useState(false);
  const [auth, setAuth] = useState<"unknown" | "guest" | "member">("unknown");
  const [wheelEligible, setWheelEligible] = useState(false);
  const [consentTick, setConsentTick] = useState(0);
  const shownThisLoad = useRef(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ribbonHidden = window.sessionStorage.getItem(RIBBON_HIDDEN_KEY) === "1";
    const dismissed = window.sessionStorage.getItem(SESSION_DISMISSED_KEY) === "1";

    const loadAuth = () => {
      storefrontGetJson<{ user?: unknown }>("/api/auth/me")
        .then((data) => {
          const member = Boolean(data?.user);
          setAuth(member ? "member" : "guest");
          // Members never see the welcome modal, so the ribbon cannot wait on
          // it being dismissed the way it does for guests.
          if ((member || dismissed) && !ribbonHidden) setRibbonVisible(true);
        })
        .catch(() => setAuth("guest"));
    };

    loadAuth();
    // AccountClient fires this after a successful login, so the state flips
    // without waiting for a reload.
    window.addEventListener("jss-cart-updated", loadAuth);
    const onConsent = () => setConsentTick((tick) => tick + 1);
    window.addEventListener("jss-consent-saved", onConsent);

    return () => {
      window.removeEventListener("jss-cart-updated", loadAuth);
      window.removeEventListener("jss-consent-saved", onConsent);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (auth !== "member") return;
    storefrontGetJson<{ eligible?: boolean }>("/api/wheel/status").then((data) =>
      setWheelEligible(Boolean(data?.eligible))
    );
  }, [auth]);

  /**
   * Guests get the register-and-save invite; members get their monthly wheel on
   * the homepage. Nothing is scheduled until we know which, so a member never
   * briefly sees a prompt to register.
   */
  useEffect(() => {
    if (auth === "unknown" || shownThisLoad.current) return;
    if (typeof window === "undefined" || !hasConsentCookie()) return;

    const member = auth === "member";
    if (member) {
      if (pathname !== "/") return;
      if (!wheelEligible) return;
      if (window.sessionStorage.getItem(WHEEL_PROMPTED_KEY) === "1") return;
    } else if (window.sessionStorage.getItem(SESSION_DISMISSED_KEY) === "1") {
      return;
    }

    const timer = window.setTimeout(() => {
      shownThisLoad.current = true;
      if (member) {
        window.sessionStorage.setItem(WHEEL_PROMPTED_KEY, "1");
        setWheelOpen(true);
        return;
      }
      setOpen(true);
      setRibbonVisible(false);
      document.body.style.overflow = "hidden";
    }, SHOW_AFTER_MS);

    return () => window.clearTimeout(timer);
  }, [auth, wheelEligible, pathname, consentTick]);

  useLayoutEffect(() => {
    if (!ribbonVisible || open) return;
    const el = widgetRef.current;
    if (!el) return;

    const pin = () => pinRibbonToVisibleBottom(el);
    pin();
    window.addEventListener("resize", pin);
    window.addEventListener("scroll", pin, true);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", pin);
    vv?.addEventListener("scroll", pin);
    return () => {
      window.removeEventListener("resize", pin);
      window.removeEventListener("scroll", pin, true);
      vv?.removeEventListener("resize", pin);
      vv?.removeEventListener("scroll", pin);
      el.style.top = "";
      el.style.left = "";
      el.style.right = "";
      el.style.bottom = "";
    };
  }, [ribbonVisible, open]);

  // Freeze the copy while an overlay is open so the slide cannot change under the user.
  useEffect(() => {
    if (!ribbonVisible || open || wheelOpen) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setRibbonSlide((current) => (current + 1) % RIBBON_SLIDES.length);
      setRibbonTheme((current) => (current === "dark" ? "light" : "dark"));
    }, RIBBON_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [ribbonVisible, open, wheelOpen]);

  function closeModal({ showRibbon = true }: { showRibbon?: boolean } = {}) {
    setOpen(false);
    document.body.style.overflow = "";
    window.sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
    if (showRibbon && window.sessionStorage.getItem(RIBBON_HIDDEN_KEY) !== "1") {
      setRibbonVisible(true);
    }
  }

  function openFromRibbon() {
    // Members are already registered, so the welcome offer means nothing to
    // them: the triangle is their way back to the monthly wheel, on any slide.
    // Guests get the register invite instead, since the wheel is members-only.
    // PrizeWheel owns its own scroll lock, and the ribbon stays mounted behind it.
    if (auth === "member") {
      setWheelOpen(true);
      return;
    }
    setRibbonVisible(false);
    setOpen(true);
    document.body.style.overflow = "hidden";
  }

  function hideRibbon() {
    setRibbonVisible(false);
    window.sessionStorage.setItem(RIBBON_HIDDEN_KEY, "1");
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const ribbonBg = ribbonTheme === "dark" ? "#000000" : "#ffffff";
  const ribbonFg = ribbonTheme === "dark" ? "#ffffff" : "#000000";

  return (
    <>
      {wheelOpen && <PrizeWheel onClose={() => setWheelOpen(false)} />}

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-offer-title"
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl shadow-black/40">
            <button
              type="button"
              onClick={() => closeModal()}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:bg-cream"
            >
              ×
            </button>

            <div className="grid gap-0 sm:grid-cols-[0.85fr_1.15fr]">
              <div className="flex min-h-[180px] flex-col items-center justify-center bg-ink px-6 py-10 sm:min-h-full">
                <Logo type="stacked" variant="dark" priority className="h-auto w-28 sm:w-32" />
              </div>

              <div className="flex flex-col p-6 sm:p-7">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-muted">
                  {t.eyebrow}
                </p>
                <h2
                  id="welcome-offer-title"
                  className="font-display mt-2 text-3xl font-extrabold uppercase leading-none tracking-tight text-ink"
                >
                  {t.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{t.body}</p>

                <div className="mt-5 rounded-2xl border border-dashed border-ink/25 bg-cream px-4 py-3">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">
                    {t.codeLabel}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="font-display text-2xl font-extrabold tracking-[0.12em] text-ink">
                      {COUPON_CODE}
                    </p>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="rounded-full border border-line bg-white px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-ink transition hover:bg-paper"
                    >
                      {copied ? t.copied : t.copyCode}
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href="/conta"
                    onClick={() => closeModal({ showRibbon: true })}
                    className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-ink-soft"
                  >
                    {t.cta}
                  </Link>
                  <button
                    type="button"
                    onClick={() => closeModal()}
                    className="text-xs font-semibold uppercase tracking-wide text-muted transition hover:text-ink"
                  >
                    {t.dismiss}
                  </button>
                </div>

                <p className="mt-4 text-[0.7rem] leading-relaxed text-muted/90">{t.fineprint}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {ribbonVisible && !open && createPortal(
        <div
          ref={widgetRef}
          className="jss-free-shipping-widget"
          data-testid="free-shipping-widget"
          data-theme={ribbonTheme}
        >
          <button
            type="button"
            onClick={openFromRibbon}
            aria-label={`${RIBBON_SLIDES[ribbonSlide].join(" ")} — ${t.title}`}
            className="jss-free-shipping-ribbon"
            style={{ backgroundColor: ribbonBg, color: ribbonFg }}
          />
          <span
            key={ribbonSlide}
            className="jss-free-shipping-ribbon__text"
            aria-hidden="true"
            data-testid="ribbon-copy"
            data-slide={ribbonSlide}
            style={{ color: ribbonFg }}
          >
            {RIBBON_SLIDES[ribbonSlide].map((word) => (
              <span key={word}>{word}</span>
            ))}
          </span>
          <button
            type="button"
            onClick={hideRibbon}
            aria-label="Dismiss"
            className="jss-free-shipping-close"
            style={{
              backgroundColor: ribbonBg,
              color: ribbonFg,
              borderColor: ribbonFg,
            }}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
              <path
                d="M2.2 2.2 L9.8 9.8 M9.8 2.2 L2.2 9.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <RibbonSurfer />
        </div>,
        document.body
      )}
    </>
  );
}
