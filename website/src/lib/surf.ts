import { BEACHES, type BeachConditions, type SurfResponse } from "@/lib/beaches";

type Current = { current?: Record<string, number | string> };

const LATS = BEACHES.map((b) => b.lat).join(",");
const LONS = BEACHES.map((b) => b.lon).join(",");

export const MARINE_URL =
  `https://marine-api.open-meteo.com/v1/marine?latitude=${LATS}&longitude=${LONS}` +
  `&current=wave_height,wave_period,wave_direction&timezone=Europe%2FLisbon`;

export const WIND_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LATS}&longitude=${LONS}` +
  `&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kn&timezone=Europe%2FLisbon`;

function toArray(d: Current | Current[]): Current[] {
  return Array.isArray(d) ? d : [d];
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function mapSurf(marine: Current[], wind: Current[]): BeachConditions[] {
  return BEACHES.map((b, i) => {
    const m = marine[i]?.current ?? {};
    const w = wind[i]?.current ?? {};
    return {
      id: b.id,
      name: b.name,
      cam: b.cam,
      waveHeight: num(m["wave_height"]),
      wavePeriod: num(m["wave_period"]),
      waveDirection: num(m["wave_direction"]),
      windSpeed: num(w["wind_speed_10m"]),
      windDirection: num(w["wind_direction_10m"]),
    };
  });
}

/** Browser-side fallback (uses the visitor's network) when /api/surf is unreachable. */
export async function fetchSurfClient(): Promise<SurfResponse> {
  const [mr, wr] = await Promise.all([fetch(MARINE_URL), fetch(WIND_URL)]);
  if (!mr.ok || !wr.ok) throw new Error("Open-Meteo request failed");
  const marine = toArray(await mr.json());
  const wind = toArray(await wr.json());
  return { updatedAt: new Date().toISOString(), beaches: mapSurf(marine, wind) };
}
