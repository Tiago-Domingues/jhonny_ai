import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { aggregateCouponUsages } from "@/lib/ecommerce/couponAnalytics";
import {
  ANALYTICS_CHART_START,
  accumulateDailyMetrics,
  todayLisbonDateKey,
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

export function hasAnalyticsConsentValue(raw?: string | null) {
  try {
    const parsed = JSON.parse(String(raw || "")) as { decisions?: { analytics?: boolean } };
    return Boolean(parsed.decisions?.analytics);
  } catch {
    return false;
  }
}

export function hasAnalyticsConsentCookie(cookieHeader?: string | null) {
  try {
    const match = String(cookieHeader || "").match(/(?:^|; )jss_consent=([^;]*)/);
    if (!match?.[1]) return false;
    return hasAnalyticsConsentValue(decodeURIComponent(match[1]));
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

export async function getAnalyticsSummary(days = 90) {
  const windowDays = [7, 30, 90].includes(days) ? days : 90;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const chartSince = new Date(`${ANALYTICS_CHART_START}T00:00:00+01:00`);

  const viewWhere = { createdAt: { gte: since } };
  const [totalViews, countryGroups, cityGroups, pathGroups, sourceGroups, recentViews, coupons, allTimeSales, chartViews, chartUsers, chartSales] =
    await Promise.all([
    prisma.pageView.count({ where: viewWhere }),
    prisma.pageView.groupBy({
      by: ["country"],
      where: viewWhere,
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["city", "country"],
      where: viewWhere,
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: viewWhere,
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["locationSource"],
      where: viewWhere,
      _count: { _all: true },
    }),
    prisma.pageView.findMany({
      where: viewWhere,
      select: {
        path: true,
        country: true,
        city: true,
        referrer: true,
        createdAt: true,
        locationSource: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    getCouponUsageSummary(windowDays),
    prisma.order.aggregate({
      where: { status: { in: [...PAID_PLUS_STATUSES] } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: chartSince } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: chartSince } },
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      where: {
        status: { in: [...PAID_PLUS_STATUSES] },
        OR: [
          { paidAt: { gte: chartSince } },
          { AND: [{ paidAt: null }, { createdAt: { gte: chartSince } }] },
        ],
      },
      select: { paidAt: true, createdAt: true, totalCents: true },
    }),
  ]);

  const byCountry = new Map<string, number>();
  const byPath = new Map<string, number>();
  const byCity = new Map<string, number>();
  const byLocationSource = new Map<string, number>();

  for (const row of countryGroups) {
    byCountry.set(row.country || "Unknown", row._count._all);
  }
  for (const row of pathGroups) {
    byPath.set(row.path || "/", row._count._all);
  }
  for (const row of cityGroups) {
    const city =
      row.city && row.country ? `${row.city}, ${row.country}` : row.city || row.country || "Unknown";
    byCity.set(city, (byCity.get(city) || 0) + row._count._all);
  }
  for (const row of sourceGroups) {
    byLocationSource.set(row.locationSource || "ip", row._count._all);
  }

  const sortCount = (map: Map<string, number>) =>
    [...map.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

  return {
    days: windowDays,
    totalViews,
    uniqueCountries: byCountry.size,
    allTimeSalesCents: allTimeSales._sum.totalCents || 0,
    allTimeOrderCount: allTimeSales._count || 0,
    byCountry: sortCount(byCountry).slice(0, 20),
    byCity: sortCount(byCity).slice(0, 20),
    byPath: sortCount(byPath).slice(0, 20),
    byDay: accumulateDailyMetrics({
      views: chartViews,
      users: chartUsers,
      sales: chartSales.map((order) => ({
        at: order.paidAt || order.createdAt,
        totalCents: order.totalCents,
      })),
      startKey: ANALYTICS_CHART_START,
      endKey: todayLisbonDateKey(),
    }),
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
    recent: recentViews.map((view) => ({
      path: view.path,
      country: view.country,
      city: view.city,
      referrer: view.referrer,
      locationSource: view.locationSource,
      createdAt: view.createdAt.toISOString(),
    })),
  };
}
