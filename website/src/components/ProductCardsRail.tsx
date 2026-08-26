"use client";

import type { ReactNode } from "react";
import { useMarqueeRail } from "@/hooks/useMarqueeRail";

type ProductCardsRailProps = {
  children: ReactNode;
  /** Tailwind from-* class for edge fades (section background). */
  fadeFromClassName?: string;
  className?: string;
  label?: string;
};

function RailArrow({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const isLeft = direction === "left";
  return (
    <button
      type="button"
      aria-label={isLeft ? "Scroll cards left" : "Scroll cards right"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`pointer-events-auto absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-ink text-white shadow-lg transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:flex ${
        isLeft ? "left-2 sm:left-4" : "right-2 sm:right-4"
      }`}
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {isLeft ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

/**
 * Continuous right-to-left product strip — same motion as Local Hero's.
 * Pointer over the rail pauses the roll so a card can be read or clicked.
 * On desktop, left/right arrows appear while hovered for manual scroll.
 */
export function ProductCardsRail({
  children,
  fadeFromClassName = "from-paper",
  className = "",
  label = "Product cards",
}: ProductCardsRailProps) {
  const rail = useMarqueeRail(320);

  return (
    <div
      className={`group relative mt-10 overflow-hidden ${className}`}
      aria-label={label}
      onPointerEnter={rail.onPointerEnter}
      onPointerLeave={rail.onPointerLeave}
    >
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r ${fadeFromClassName} to-transparent sm:w-20`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l ${fadeFromClassName} to-transparent sm:w-20`}
      />
      {rail.showArrows && (
        <>
          <RailArrow direction="left" onClick={rail.nudgeLeft} />
          <RailArrow direction="right" onClick={rail.nudgeRight} />
        </>
      )}
      <div
        ref={rail.trackRef}
        className="flex w-max animate-[marquee_50s_linear_infinite] items-stretch hover:[animation-play-state:paused] group-hover:[animation-play-state:paused]"
        style={rail.trackStyle}
      >
        <div className="flex items-stretch">{children}</div>
        <div className="flex items-stretch" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
