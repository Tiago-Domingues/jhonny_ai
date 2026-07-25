import "server-only";

import { createHash, timingSafeEqual } from "crypto";

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

/** Constant-time string compare via SHA-256 digests (equal length). */
export function secretsEqual(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory sliding fixed-window limiter.
 * Good enough for single-region Vercel until Redis/Upstash is wired.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic cleanup of expired keys
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) {
        if (now >= v.resetAt) buckets.delete(k);
      }
    }
    return { ok: true as const, retryAfterSec: 0 };
  }
  if (current.count >= limit) {
    return {
      ok: false as const,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { ok: true as const, retryAfterSec: 0 };
}

export function rateLimitResponse(retryAfterSec: number) {
  return Response.json(
    {
      error: "rate_limited",
      message: "Too many requests. Try again shortly.",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

export function enforceRateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const result = rateLimit(`${scope}:${clientIp(request)}`, limit, windowMs);
  if (!result.ok) return rateLimitResponse(result.retryAfterSec);
  return null;
}

/** Shared secret for cron/status probes (CRON_SECRET or ODOO_SYNC_SECRET). */
export function readOpsSecret() {
  return process.env.CRON_SECRET?.trim() || process.env.ODOO_SYNC_SECRET?.trim() || "";
}

export function hasValidOpsBearer(request: Request) {
  const expected = readOpsSecret();
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const alt =
    request.headers.get("x-odoo-sync-secret")?.trim() ||
    request.headers.get("x-ops-secret")?.trim() ||
    "";
  return secretsEqual(bearer, expected) || secretsEqual(alt, expected);
}
