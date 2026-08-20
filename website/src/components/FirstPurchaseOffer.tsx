"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/components/LanguageProvider";

const SESSION_DISMISSED_KEY = "jss_welcome_offer_dismissed_v1";
const RIBBON_HIDDEN_KEY = "jss_welcome_ribbon_hidden_v1";
const COUPON_CODE = "JHONNY10";
const SHOW_AFTER_MS = 7000;

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
    ribbon: "Free Shipping",
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
    ribbon: "Free Shipping",
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
    ribbon: "Free Shipping",
  },
} as const;

function hasConsentCookie() {
  return typeof document !== "undefined" && document.cookie.includes("jss_consent=");
}

export function FirstPurchaseOffer() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [open, setOpen] = useState(false);
  const [ribbonVisible, setRibbonVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const shownThisLoad = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ribbonHidden = window.sessionStorage.getItem(RIBBON_HIDDEN_KEY) === "1";
    const dismissed = window.sessionStorage.getItem(SESSION_DISMISSED_KEY) === "1";
    if (dismissed && !ribbonHidden) {
      setRibbonVisible(true);
    }

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const show = () => {
      if (shownThisLoad.current) return;
      if (!hasConsentCookie()) return;
      // If user already dismissed this session, keep ribbon only (no auto re-popup).
      if (window.sessionStorage.getItem(SESSION_DISMISSED_KEY) === "1") {
        if (window.sessionStorage.getItem(RIBBON_HIDDEN_KEY) !== "1") {
          setRibbonVisible(true);
        }
        return;
      }
      shownThisLoad.current = true;
      setOpen(true);
      setRibbonVisible(false);
      document.body.style.overflow = "hidden";
    };

    const arm = () => {
      clearTimer();
      if (shownThisLoad.current) return;
      if (!hasConsentCookie()) return;
      timerRef.current = setTimeout(show, SHOW_AFTER_MS);
    };

    const onConsent = () => arm();

    if (hasConsentCookie()) {
      arm();
    }
    window.addEventListener("jss-consent-saved", onConsent);

    return () => {
      clearTimer();
      window.removeEventListener("jss-consent-saved", onConsent);
      document.body.style.overflow = "";
    };
  }, []);

  function closeModal({ showRibbon = true }: { showRibbon?: boolean } = {}) {
    setOpen(false);
    document.body.style.overflow = "";
    window.sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
    if (showRibbon && window.sessionStorage.getItem(RIBBON_HIDDEN_KEY) !== "1") {
      setRibbonVisible(true);
    }
  }

  function openFromRibbon() {
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

  return (
    <>
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

      {ribbonVisible && !open && (
        <div className="pointer-events-none fixed bottom-0 left-0 z-[65]">
          <button
            type="button"
            onClick={openFromRibbon}
            aria-label={`${t.ribbon} — ${t.title}`}
            className="jss-free-shipping-ribbon pointer-events-auto relative block h-[7.5rem] w-[7.5rem] bg-ink text-white shadow-lg transition hover:brightness-110 sm:h-32 sm:w-32"
          >
            <span className="absolute left-1/2 top-[42%] w-[7.5rem] -translate-x-1/2 -translate-y-1/2 -rotate-45 text-center text-[0.7rem] font-extrabold uppercase leading-tight tracking-[0.12em] sm:text-xs">
              Free
              <br />
              Shipping
            </span>
          </button>
          <button
            type="button"
            onClick={hideRibbon}
            aria-label="Dismiss"
            className="pointer-events-auto absolute bottom-[5.6rem] left-[5.6rem] flex h-7 w-7 items-center justify-center rounded-full border border-white bg-ink text-sm font-bold text-white shadow-md transition hover:scale-105 sm:bottom-[6.1rem] sm:left-[6.1rem] sm:h-8 sm:w-8"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
