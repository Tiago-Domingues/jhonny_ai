import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { aggregateCouponUsages } from "@/lib/ecommerce/couponAnalytics";
import {
  ANALYTICS_CHART_START,
  fillDailyRange,
  todayLisbonDateKey,
  type DailyMetrics,
} from "@/lib/ecommerce/analyticsDaily";
import { PAID_PLUS_STATUSES } from "@/lib/ecommerce/orderKpis";

export async function recordPageView(input: {
  path: string;
  referrer?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracyM?: number | null;
  locationSource?: "gps" | "ip" | null;
}) {
  const path = input.path.slice(0, 300);
  if (!path.startsWith("/")) return null;
  // Skip noisy internal/admin beacons from polluting public analytics.
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) {
    return null;
  }

  return prisma.pageView.create({
    data: {
      path,
      referrer: input.referrer?.slice(0, 500) || null,
      country: input.country?.slice(0, 8) || null,
      region: input.region?.slice(0, 80) || null,
      city: input.city?.slice(0, 80) || null,
      userAgent: input.userAgent?.slice(0, 300) || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      locationAccuracyM: input.locationAccuracyM ?? null,
      locationSource: input.locationSource || (input.country || input.city ? "ip" : null),
    },
  });
}

export function hasAnalyticsConsentCookie(cookieHeader?: string | null) {
  try {
    const match = String(cookieHeader || "").match(/(?:^|; )jss_consent=([^;]*)/);
    if (!match?.[1]) return false;
    const parsed = JSON.parse(decodeURIComponent(match[1])) as { decisions?: { analytics?: boolean } };
    return Boolean(parsed.decisions?.analytics);
  } catch {
    return false;
  }
}

export async function getCouponUsageSummary(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const usages = await prisma.couponUsage.findMany({
    where: { createdAt: { gte: since } },
    include: { coupon: { select: { label: true, percentOff: true } } },
    orderBy: { createdAt: "desc" },
  });
  return aggregateCouponUsages(
    usages.map((usage) => ({
      code: usage.code,
      discountCents: usage.discountCents,
      createdAt: usage.createdAt,
      label: usage.coupon?.label,
      percentOff: usage.coupon?.percentOff,
    }))
  );
}

async function countByLisbonDay(table: "PageView" | "User", since: Date) {
  return prisma.$queryRawUnsafe<Array<{ day: string; count: number }>>(
    `SELECT to_char(timezone('Europe/Lisbon', "createdAt"), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
     FROM "${table}"
     WHERE "createdAt" >= $1
     GROUP BY 1`,
    since
  );
}

export async function getAnalyticsSummary(days = 90) {
  const windowDays = [7, 30, 90].includes(days) ? days : 90;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const chartSince = new Date(`${ANALYTICS_CHART_START}T00:00:00+01:00`);

  const [views, coupons, allTimeSales, viewDays, userDays, saleDays] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: {
        path: true,
        country: true,
        city: true,
        referrer: true,
        createdAt: true,
        locationSource: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    getCouponUsageSummary(windowDays),
    prisma.order.aggregate({
      where: { status: { in: [...PAID_PLUS_STATUSES] } },
      _sum: { totalCents: true },
      _count: true,
    }),
    countByLisbonDay("PageView", chartSince),
    countByLisbonDay("User", chartSince),
    prisma.$queryRawUnsafe<Array<{ day: string; sales_count: number; sales_cents: number }>>(
      `SELECT to_char(timezone('Europe/Lisbon', COALESCE("paidAt", "createdAt")), 'YYYY-MM-DD') AS day,
              COUNT(*)::int AS sales_count,
              COALESCE(SUM("totalCents"), 0)::int AS sales_cents
       FROM "Order"
       WHERE status IN ('PAID','PREPARING','READY_FOR_PICKUP','SHIPPED','DELIVERED')
         AND COALESCE("paidAt", "createdAt") >= $1
       GROUP BY 1`,
      chartSince
    ),
  ]);

  const byCountry = new Map<string, number>();
  const byPath = new Map<string, number>();
  const byCity = new Map<string, number>();
  const byLocationSource = new Map<string, number>();

  for (const view of views) {
    const country = view.country || "Unknown";
    const path = view.path || "/";
    const city = view.city && view.country ? `${view.city}, ${view.country}` : view.city || country;
    byCountry.set(country, (byCountry.get(country) || 0) + 1);
    byPath.set(path, (byPath.get(path) || 0) + 1);
    byCity.set(city, (byCity.get(city) || 0) + 1);
    const source = view.locationSource || "ip";
    byLocationSource.set(source, (byLocationSource.get(source) || 0) + 1);
  }

  const sortCount = (map: Map<string, number>) =>
    [...map.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

  const dailyMap = new Map<string, DailyMetrics>();
  for (const row of viewDays) {
    dailyMap.set(row.day, {
      key: row.day,
      views: Number(row.count) || 0,
      newClients: 0,
      salesCount: 0,
      salesCents: 0,
    });
  }
  for (const row of userDays) {
    const current = dailyMap.get(row.day) || { key: row.day, views: 0, newClients: 0, salesCount: 0, salesCents: 0 };
    current.newClients = Number(row.count) || 0;
    dailyMap.set(row.day, current);
  }
  for (const row of saleDays) {
    const current = dailyMap.get(row.day) || { key: row.day, views: 0, newClients: 0, salesCount: 0, salesCents: 0 };
    current.salesCount = Number(row.sales_count) || 0;
    current.salesCents = Number(row.sales_cents) || 0;
    dailyMap.set(row.day, current);
  }

  return {
    days: windowDays,
    totalViews: views.length,
    uniqueCountries: byCountry.size,
    allTimeSalesCents: allTimeSales._sum.totalCents || 0,
    allTimeOrderCount: allTimeSales._count || 0,
    byCountry: sortCount(byCountry).slice(0, 20),
    byCity: sortCount(byCity).slice(0, 20),
    byPath: sortCount(byPath).slice(0, 20),
    byDay: fillDailyRange(ANALYTICS_CHART_START, todayLisbonDateKey(), [...dailyMap.values()]),
    byLocationSource: sortCount(byLocationSource),
    coupons: coupons.map((coupon) => ({
      key: `${coupon.code} (−${coupon.percentOff}%)`,
      code: coupon.code,
      label: coupon.label,
      percentOff: coupon.percentOff,
      count: coupon.count,
      discountCents: coupon.discountCents,
      lastUsed: coupon.lastUsed.toISOString(),
    })),
    recent: views.slice(0, 25).map((view) => ({
      path: view.path,
      country: view.country,
      city: view.city,
      referrer: view.referrer,
      locationSource: view.locationSource,
      createdAt: view.createdAt.toISOString(),
    })),
  };
}
