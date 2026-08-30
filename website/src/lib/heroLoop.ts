/**
 * Homepage hero loop: surf film ↔ black title card.
 * Tune timings here — Hero.tsx reads these constants.
 */
export const HERO_LOOP = {
  videoMs: 16_000,
  inkMs: 16_000,
  fadeMs: 900,
} as const;

export type HeroPanel = "video" | "ink";
