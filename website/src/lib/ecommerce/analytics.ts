import "server-only";

import { prisma } from "@/lib/ecommerce/db";

export async function recordPageView(input: {
  path: string;
  referrer?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
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
    },
  });
}

export async function getAnalyticsSummary(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const views = await prisma.pageView.findMany({
    where: { createdAt: { gte: since } },
    select: { path: true, country: true, city: true, referrer: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const byCountry = new Map<string, number>();
  const byPath = new Map<string, number>();
  const byDay = new Map<string, number>();
  const byCity = new Map<string, number>();

  for (const view of views) {
    const country = view.country || "Unknown";
    const path = view.path || "/";
    const day = view.createdAt.toISOString().slice(0, 10);
    const city = view.city && view.country ? `${view.city}, ${view.country}` : view.city || country;
    byCountry.set(country, (byCountry.get(country) || 0) + 1);
    byPath.set(path, (byPath.get(path) || 0) + 1);
    byDay.set(day, (byDay.get(day) || 0) + 1);
    byCity.set(city, (byCity.get(city) || 0) + 1);
  }

  const sortCount = (map: Map<string, number>) =>
    [...map.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

  return {
    days,
    totalViews: views.length,
    uniqueCountries: byCountry.size,
    byCountry: sortCount(byCountry).slice(0, 20),
    byCity: sortCount(byCity).slice(0, 20),
    byPath: sortCount(byPath).slice(0, 20),
    byDay: sortCount(byDay).sort((a, b) => a.key.localeCompare(b.key)),
    recent: views.slice(0, 25).map((view) => ({
      path: view.path,
      country: view.country,
      city: view.city,
      referrer: view.referrer,
      createdAt: view.createdAt.toISOString(),
    })),
  };
}
