import { NextResponse } from "next/server";
import type { SurfResponse } from "@/lib/beaches";
import { MARINE_URL, WIND_URL, mapSurf } from "@/lib/surf";

export const revalidate = 1800; // seconds (~30 min)

type Current = { current?: Record<string, number | string> };

function toArray(d: Current | Current[]): Current[] {
  return Array.isArray(d) ? d : [d];
}

export async function GET() {
  try {
    const [marineRes, windRes] = await Promise.all([
      fetch(MARINE_URL, { next: { revalidate } }),
      fetch(WIND_URL, { next: { revalidate } }),
    ]);

    if (!marineRes.ok || !windRes.ok) {
      throw new Error("Open-Meteo request failed");
    }

    const marine = toArray(await marineRes.json());
    const wind = toArray(await windRes.json());

    const payload: SurfResponse = {
      updatedAt: new Date().toISOString(),
      beaches: mapSurf(marine, wind),
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Conditions unavailable" },
      { status: 502 }
    );
  }
}
