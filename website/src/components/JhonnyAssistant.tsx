"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CloseIcon, WhatsappIcon } from "@/components/icons";
import { useLanguage } from "@/components/LanguageProvider";
import { whatsappHref, WHATSAPP_MESSAGES } from "@/lib/i18n";

const SEEN_KEY = "jss_jhonny_assistant_seen_v1";
const TIP_DELAY_MS = 4500;
const TIP_VISIBLE_MS = 6000;
const TYPING_MS = 900;

/**
 * Single swap point for the real agent. While unset the panel renders the
 * placeholder conversation; once pointed at a deployed agent it embeds it,
 * with no changes needed in the layout.
 */
const AGENT_URL = process.env.NEXT_PUBLIC_JHONNY_AGENT_URL;

const copy = {
  pt: {
    name: "Jhonny AI",
    role: "Assistente da loja",
    tooltip: "Fala com o assistente Jhonny AI",
    openLabel: "Abrir o assistente Jhonny AI",
    close: "Fechar",
    greeting:
      "Olá! Sou o Jhonny AI. Posso ajudar-te a escolher a prancha certa, tirar dúvidas sobre produtos e contar-te tudo sobre a loja.",
    soon: "Em breve",
    placeholder: "O chat chega muito em breve…",
    send: "Enviar",
    fallbackIntro: "Precisas de ajuda já?",
    fallbackCta: "Falar por WhatsApp",
  },
  en: {
    name: "Jhonny AI",
    role: "Store assistant",
    tooltip: "Get help from Jhonny AI assistant",
    openLabel: "Open the Jhonny AI assistant",
    close: "Close",
    greeting:
      "Hi! I'm Jhonny AI. I can help you pick the right board, answer questions about our products and tell you anything about the store.",
    soon: "Coming soon",
    placeholder: "Chat is coming very soon…",
    send: "Send",
    fallbackIntro: "Need a hand right now?",
    fallbackCta: "Chat on WhatsApp",
  },
  zh: {
    name: "Jhonny AI",
    role: "门店助理",
    tooltip: "向 Jhonny AI 助理寻求帮助",
    openLabel: "打开 Jhonny AI 助理",
    close: "关闭",
    greeting:
      "你好！我是 Jhonny AI。我可以帮你挑选合适的冲浪板、解答产品问题，并介绍关于门店的一切。",
    soon: "即将推出",
    placeholder: "聊天功能即将上线…",
    send: "发送",
    fallbackIntro: "现在就需要帮助？",
    fallbackCta: "通过 WhatsApp 联系",
  },
} as const;

/** Stable identity so useSyncExternalStore does not resubscribe every render. */
const noopSubscribe = () => () => {};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("jss-a11y-motion")
  );
}

function JhonnyAvatar({ className }: { className?: string }) {
  const [src, setSrc] = useState("/brand/jhonny-character-cut.png");
  return (
    <Image
      src={src}
      alt=""
      width={72}
      height={96}
      onError={() => setSrc("/brand/jhonny-character-cut.svg")}
      className={className}
    />
  );
}

export function JhonnyAssistant() {
  const { locale } = useLanguage();
  const t = copy[locale];

  const [open, setOpen] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [typing, setTyping] = useState(false);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Assume "seen" on the server so the attention dot never flashes during hydration.
  const seenBefore = useSyncExternalStore(
    noopSubscribe,
    () => window.localStorage.getItem(SEEN_KEY) === "1",
    () => true
  );
  const [openedHere, setOpenedHere] = useState(false);
  const seen = seenBefore || openedHere;

  // Nudge the tooltip out once so the assistant gets discovered, then retract.
  useEffect(() => {
    if (seen || open) return;
    const showTimer = window.setTimeout(() => setNudging(true), TIP_DELAY_MS);
    const hideTimer = window.setTimeout(
      () => setNudging(false),
      TIP_DELAY_MS + TIP_VISIBLE_MS
    );
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [seen, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      bubbleRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The placeholder still "thinks" before greeting, so it does not feel dead.
  useEffect(() => {
    if (!open || !typing) return;
    const timer = window.setTimeout(() => setTyping(false), TYPING_MS);
    return () => window.clearTimeout(timer);
  }, [open, typing]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  function openPanel() {
    setOpen(true);
    setNudging(false);
    setOpenedHere(true);
    setTyping(!prefersReducedMotion());
    window.localStorage.setItem(SEEN_KEY, "1");
  }

  function closePanel() {
    setOpen(false);
    bubbleRef.current?.focus();
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={t.close}
          tabIndex={-1}
          className="jss-fade-in fixed inset-0 z-[66] cursor-default bg-ink/20"
          onClick={closePanel}
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-labelledby="jhonny-assistant-title"
          data-testid="jhonny-assistant-panel"
          /* Above the corner ribbon (z-65), which otherwise cuts into the panel
             on mobile, but below the cart/search drawers (z-70). */
          className="jss-assistant-panel fixed inset-x-4 bottom-[5.75rem] z-[67] flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-5 sm:w-[22rem]"
        >
          <div className="flex items-center gap-3 bg-ink px-4 py-3">
            {/* Cream disc, not ink: the mascot is dark and would vanish into the band. */}
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream ring-2 ring-cream">
              <JhonnyAvatar className="h-8 w-auto object-contain" />
            </span>
            <div className="min-w-0 flex-1">
              <p
                id="jhonny-assistant-title"
                className="font-display text-sm font-extrabold uppercase tracking-[0.12em] text-white"
              >
                {t.name}
              </p>
              <p className="flex items-center gap-1.5 text-[0.7rem] text-white/60">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                {t.role}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={closePanel}
              aria-label={t.close}
              data-testid="jhonny-assistant-close"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {AGENT_URL ? (
            <iframe
              src={AGENT_URL}
              title={t.name}
              className="h-[26rem] w-full border-0 bg-white"
            />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {typing ? (
                  <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-sm bg-cream px-3 py-3">
                    <span className="jss-typing-dot h-1.5 w-1.5 rounded-full bg-ink" />
                    <span className="jss-typing-dot h-1.5 w-1.5 rounded-full bg-ink" />
                    <span className="jss-typing-dot h-1.5 w-1.5 rounded-full bg-ink" />
                  </div>
                ) : (
                  <div className="jss-rise-in">
                    <p className="max-w-[16rem] rounded-2xl rounded-bl-sm bg-cream px-3.5 py-2.5 text-sm leading-relaxed text-ink">
                      {t.greeting}
                    </p>
                    <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">
                      {t.soon}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-line px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder={t.placeholder}
                    aria-label={t.placeholder}
                    className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2 text-sm text-ink placeholder:text-muted/70 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    disabled
                    aria-label={t.send}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white opacity-40"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                      <path
                        d="M4 12 20 4 12 20 11 13 4 12Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.7rem] text-muted">
                  {t.fallbackIntro}
                  <a
                    href={whatsappHref(WHATSAPP_MESSAGES[locale])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-ink underline underline-offset-2 transition hover:text-muted"
                  >
                    <WhatsappIcon className="h-3.5 w-3.5" />
                    {t.fallbackCta}
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <div
        className="fixed bottom-5 right-5 z-[68] flex items-center gap-2"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        {!open && (nudging || hovered) && (
          <span
            className="jss-assistant-tip hidden whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-black/20 sm:inline-block"
            aria-hidden="true"
          >
            {t.tooltip}
          </span>
        )}

        <button
          ref={bubbleRef}
          type="button"
          onClick={() => (open ? closePanel() : openPanel())}
          aria-label={t.openLabel}
          aria-expanded={open}
          title={t.tooltip}
          data-testid="jhonny-assistant-bubble"
          /* Cream disc with an ink rim: the mascot is dark, so an ink disc
             swallowed him, and the rim keeps the bubble defined on pale pages. */
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-cream shadow-lg shadow-black/30 ring-[3px] ring-ink transition hover:scale-105 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {/* Cropped tall so Jhonny peeks over the rim instead of sitting boxed in. */}
          <JhonnyAvatar className="jss-assistant-toy h-14 w-auto -translate-y-1.5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />

          {/* Decorative WhatsApp mark — not a link; chat panel has the real WhatsApp CTA. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-white ring-2 ring-cream"
          >
            <WhatsappIcon className="h-2.5 w-2.5" />
          </span>

          {!seen && !open && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center">
              <span className="jss-assistant-ping absolute inline-flex h-3 w-3 rounded-full bg-ink" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ink ring-2 ring-cream" />
            </span>
          )}
        </button>
      </div>
    </>
  );
}
