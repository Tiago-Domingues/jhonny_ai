"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type ProductCardsRailProps = {
  children: ReactNode;
  /** Tailwind from-* class for edge fades (section background). */
  fadeFromClassName?: string;
  className?: string;
  label?: string;
};

export function ProductCardsRail({
  children,
  fadeFromClassName = "from-paper",
  className = "",
  label = "Product cards",
}: ProductCardsRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollByCard = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rail-card]");
    const gap = 24;
    const amount = card ? card.offsetWidth + gap : Math.max(280, Math.round(el.clientWidth * 0.75));
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className={`relative mt-10 ${className}`}>
      <button
        type="button"
        aria-label={`Scroll ${label} left`}
        onClick={() => scrollByCard(-1)}
        disabled={!canScrollLeft}
        className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-md transition hover:bg-cream disabled:pointer-events-none disabled:opacity-30 sm:left-4 sm:h-12 sm:w-12"
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
          <path
            d="M12.5 4.5 7 10l5.5 5.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        aria-label={`Scroll ${label} right`}
        onClick={() => scrollByCard(1)}
        disabled={!canScrollRight}
        className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-md transition hover:bg-cream disabled:pointer-events-none disabled:opacity-30 sm:right-4 sm:h-12 sm:w-12"
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
          <path
            d="M7.5 4.5 13 10l-5.5 5.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r ${fadeFromClassName} to-transparent sm:w-20`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l ${fadeFromClassName} to-transparent sm:w-20`}
      />

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-5 pb-1 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
