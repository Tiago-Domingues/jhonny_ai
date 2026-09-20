import { after } from "next/server";
import { cookies, headers } from "next/headers";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { hasAnalyticsConsentValue, recordPageView } from "@/lib/ecommerce/analytics";

export async function shouldSkipInitialVisitBeacon() {
  const headerStore = await headers();
  const cookieStore = await cookies();
  return (
    headerStore.get("sec-fetch-dest") === "document" &&
    hasAnalyticsConsentValue(cookieStore.get("jss_consent")?.value)
  );
}

/** Records a first-party pageview on full document loads when analytics consent is on. */
export async function ServerVisitCollector() {
  if (!hasDatabaseUrl()) return null;

  const headerStore = await headers();
  if (headerStore.get("sec-fetch-dest") !== "document") return null;
  if (!hasAnalyticsConsentValue((await cookies()).get("jss_consent")?.value)) return null;

  const path = headerStore.get("x-jss-pathname") || "/";
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) {
    return null;
  }

  const country = headerStore.get("x-vercel-ip-country");
  const region = headerStore.get("x-vercel-ip-country-region");
  const city = headerStore.get("x-vercel-ip-city");
  const userAgent = headerStore.get("user-agent");
  const referrer = headerStore.get("referer");

  after(async () => {
    try {
      await recordPageView({
        path,
        referrer,
        country,
        region,
        city,
        userAgent,
        locationSource: country || city ? "ip" : null,
      });
    } catch (error) {
      console.error("server_visit_collect_failed", error instanceof Error ? error.message : error);
    }
  });

  return null;
}
