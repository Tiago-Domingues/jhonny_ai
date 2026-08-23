"use client";

import { useState, type ReactNode } from "react";

type ProductCardsRailProps = {
  children: ReactNode;
  /** Tailwind from-* class for edge fades (section background). */
  fadeFromClassName?: string;
  className?: string;
  label?: string;
};

/**
 * Continuous right-to-left product strip — same motion as Local Hero's.
 * Pointer over the rail pauses the roll so a card can be read or clicked.
 */
export function ProductCardsRail({
  children,
  fadeFromClassName = "from-paper",
  className = "",
  label = "Product cards",
}: ProductCardsRailProps) {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className={`group relative mt-10 overflow-hidden ${className}`}
      aria-label={label}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r ${fadeFromClassName} to-transparent sm:w-20`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l ${fadeFromClassName} to-transparent sm:w-20`}
      />
      <div
        className="flex w-max animate-[marquee_50s_linear_infinite] items-stretch hover:[animation-play-state:paused] group-hover:[animation-play-state:paused]"
        style={paused ? { animationPlayState: "paused" } : undefined}
      >
        <div className="flex items-stretch">{children}</div>
        <div className="flex items-stretch" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
