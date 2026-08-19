export type SurfLevel = "initial" | "intermediate" | "advanced" | "professional";

export type SurfFrequency = "rare" | "occasional" | "active" | "addicted";

export type WaveQuality = "low" | "medium" | "high";

export type VolumeCalculatorInput = {
  weightKg: number | null;
  ageYears: number | null;
  level: SurfLevel | "";
  frequency: SurfFrequency | "";
  waveQuality: WaveQuality | "";
};

/** Lookup table ported from the 58 Surf / Despomar volume calculator. */
const BASE_VOLUMES: Record<SurfLevel, Record<number, number>> = {
  initial: {
    35: 25.9,
    40: 29.2,
    45: 32.4,
    50: 35.5,
    55: 37.25,
    60: 40.8,
    65: 44.2,
    70: 47.6,
    75: 51.0,
    80: 54.4,
    85: 57.8,
    90: 61.2,
    95: 64.6,
    100: 68.0,
    105: 71.4,
    110: 74.8,
  },
  intermediate: {
    35: 21.0,
    40: 23.6,
    45: 26.1,
    50: 28.5,
    55: 30.25,
    60: 32.4,
    65: 35.1,
    70: 37.8,
    75: 40.5,
    80: 43.2,
    85: 45.9,
    90: 48.6,
    95: 51.3,
    100: 54.0,
    105: 56.7,
    110: 59.4,
  },
  advanced: {
    35: 15.75,
    40: 17.2,
    45: 18.9,
    50: 20.5,
    55: 21.45,
    60: 22.8,
    65: 24.7,
    70: 26.6,
    75: 28.5,
    80: 30.4,
    85: 32.3,
    90: 34.2,
    95: 36.1,
    100: 38.0,
    105: 39.9,
    110: 41.8,
  },
  professional: {
    35: 15.05,
    40: 16.4,
    45: 18.0,
    50: 19.0,
    55: 19.8,
    60: 21.0,
    65: 22.75,
    70: 24.7,
    75: 26.25,
    80: 28.0,
    85: 29.75,
    90: 31.5,
    95: 33.25,
    100: 35.0,
    105: 36.75,
    110: 38.5,
  },
};

export function bucketWeightKg(weightKg: number) {
  if (weightKg <= 35) return 35;
  if (weightKg <= 40) return 40;
  if (weightKg <= 45) return 45;
  if (weightKg <= 50) return 50;
  if (weightKg <= 55) return 55;
  if (weightKg <= 60) return 60;
  if (weightKg <= 65) return 65;
  if (weightKg <= 70) return 70;
  if (weightKg <= 75) return 75;
  if (weightKg <= 80) return 80;
  if (weightKg <= 85) return 85;
  if (weightKg <= 90) return 90;
  if (weightKg <= 95) return 95;
  if (weightKg <= 100) return 100;
  if (weightKg <= 105) return 105;
  return 110;
}

export function ageMultiplier(ageYears: number | null) {
  if (!ageYears || ageYears <= 30) return 1;
  if (ageYears <= 50) return 1.08;
  if (ageYears <= 60) return 1.2;
  return 1.3;
}

export function frequencyMultiplier(frequency: SurfFrequency | "") {
  if (frequency === "rare") return 1.2;
  if (frequency === "occasional") return 1.1;
  if (frequency === "active") return 1.05;
  return 1;
}

export function waveQualityMultiplier(waveQuality: WaveQuality | "") {
  if (waveQuality === "low") return 1.1;
  if (waveQuality === "medium") return 1.05;
  return 1;
}

export function getBaseVolumeLiters(level: SurfLevel, weightKg: number) {
  const bucket = bucketWeightKg(weightKg);
  return BASE_VOLUMES[level][bucket] ?? null;
}

export function calculateRecommendedVolume(input: VolumeCalculatorInput) {
  if (!input.level || !input.weightKg || input.weightKg <= 0) {
    return null;
  }

  const base = getBaseVolumeLiters(input.level, input.weightKg);
  if (base == null) return null;

  const volume =
    base *
    ageMultiplier(input.ageYears) *
    frequencyMultiplier(input.frequency) *
    waveQualityMultiplier(input.waveQuality);

  return Math.round(volume * 100) / 100;
}

export function surfboardsShopHref(volumeLiters: number | null) {
  const href = "/loja?categoryGroup=surfboards";
  if (volumeLiters == null) return href;
  const min = Math.floor(volumeLiters - 1);
  const max = Math.ceil(volumeLiters + 1);
  return `${href}&volumeMin=${min}&volumeMax=${max}`;
}

export const VOLUME_CALCULATOR_PATH = "/calculadora-volume";
