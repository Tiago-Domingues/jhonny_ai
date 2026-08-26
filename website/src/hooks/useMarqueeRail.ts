"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";

/** Approx one product/athlete card width including gap, used for arrow nudges. */
const DEFAULT_NUDGE_PX = 320;

function isDesktopFinePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)").matches;
}

function readTranslateX(el: HTMLElement): number {
  const raw = getComputedStyle(el).transform;
  if (!raw || raw === "none") return 0;
  try {
    const matrix = new DOMMatrixReadOnly(raw);
    return matrix.m41;
  } catch {
    const match = raw.match(/matrix\(([^)]+)\)/);
    if (!match) return 0;
    const parts = match[1].split(",").map((p) => Number(p.trim()));
    return parts.length === 6 ? parts[4] : 0;
  }
}

/**
 * Pause-on-hover marquee with desktop-only arrow nudges.
 * Mobile keeps CSS auto-roll only (no arrows / no manual offset).
 */
export function useMarqueeRail(nudgePx = DEFAULT_NUDGE_PX) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);
  const [offset, setOffset] = useState(0);

  const onPointerEnter = useCallback(() => {
    if (!isDesktopFinePointer()) return;
    const el = trackRef.current;
    if (el) {
      setOffset(readTranslateX(el));
      setManual(true);
    }
    setPaused(true);
  }, []);

  const onPointerLeave = useCallback(() => {
    setPaused(false);
    setManual(false);
  }, []);

  const nudge = useCallback(
    (direction: -1 | 1) => {
      setOffset((prev) => prev + direction * nudgePx);
    },
    [nudgePx]
  );

  const trackStyle: CSSProperties | undefined =
    paused && manual ? { transform: `translateX(${offset}px)`, animation: "none" } : undefined;

  return {
    trackRef,
    paused,
    showArrows: paused && manual,
    onPointerEnter,
    onPointerLeave,
    nudgeLeft: () => nudge(1),
    nudgeRight: () => nudge(-1),
    trackStyle,
  };
}
