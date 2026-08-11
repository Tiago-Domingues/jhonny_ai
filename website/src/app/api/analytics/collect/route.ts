import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { recordPageView } from "@/lib/ecommerce/analytics";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";

const schema = z.object({
  path: z.string().min(1).max(300),
  referrer: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "analytics-collect", 60, 60_000);
  if (limited) return limited;

  try {
    const body = schema.parse(await readJson(request));
    await recordPageView({
      path: body.path,
      referrer: body.referrer,
      country: request.headers.get("x-vercel-ip-country"),
      region: request.headers.get("x-vercel-ip-country-region"),
      city: request.headers.get("x-vercel-ip-city"),
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
