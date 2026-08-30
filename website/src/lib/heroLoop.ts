/**
 * Homepage hero loop: surf film ↔ store illustration.
 * Tune timings here — Hero.tsx reads these constants.
 */
export const HERO_LOOP = {
  videoMs: 16_000,
  storeMs: 16_000,
  fadeMs: 900,
} as const;

export type HeroPanel = "video" | "store";
