/**
 * Homepage hero loop: surf film ↔ store illustration.
 * Tune timings here — Hero.tsx reads these constants.
 */
export const HERO_LOOP = {
  videoMs: 11_000,
  storeMs: 11_000,
  fadeMs: 900,
} as const;

export type HeroPanel = "video" | "store";
