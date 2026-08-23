import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { hasAnalyticsConsentCookie, recordPageView } from "@/lib/ecommerce/analytics";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

const schema = z.object({
  path: z.string().min(1).max(300),
  referrer: z.string().max(500).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  locationAccuracyM: z.number().min(0).max(100000).optional().nullable(),
});

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "analytics-collect", 60, 60_000);
  if (limited) return limited;

  try {
    const body = schema.parse(await readJson(request));
    const analyticsConsent = hasAnalyticsConsentCookie(request.headers.get("cookie"));
    const wantsGps = body.latitude != null && body.longitude != null;
    if (wantsGps && !analyticsConsent) {
      return NextResponse.json({ error: "analytics_consent_required" }, { status: 403 });
    }
    await recordPageView({
      path: body.path,
      referrer: body.referrer,
      country: request.headers.get("x-vercel-ip-country"),
      region: request.headers.get("x-vercel-ip-country-region"),
      city: request.headers.get("x-vercel-ip-city"),
      userAgent: request.headers.get("user-agent"),
      latitude: analyticsConsent ? body.latitude : null,
      longitude: analyticsConsent ? body.longitude : null,
      locationAccuracyM: analyticsConsent ? body.locationAccuracyM : null,
      locationSource: analyticsConsent && wantsGps ? "gps" : "ip",
    });
    return NextResponse.json({
      ok: true,
      country: request.headers.get("x-vercel-ip-country"),
      region: request.headers.get("x-vercel-ip-country-region"),
      city: request.headers.get("x-vercel-ip-city"),
    });
  } catch (error) {
    return apiError(error);
  }
}
