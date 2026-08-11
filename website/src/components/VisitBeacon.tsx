"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function hasAnalyticsConsent() {
  try {
    const match = document.cookie.match(/(?:^|; )jss_consent=([^;]*)/);
    if (!match?.[1]) return false;
    const parsed = JSON.parse(decodeURIComponent(match[1])) as {
      decisions?: { analytics?: boolean };
    };
    return Boolean(parsed.decisions?.analytics);
  } catch {
    return false;
  }
}

/** Sends a first-party pageview when analytics cookies are accepted. */
export function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const send = () => {
      if (!hasAnalyticsConsent()) return;
      void fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer || null,
        }),
        keepalive: true,
      }).catch(() => undefined);
    };

    send();
    const onConsent = () => send();
    window.addEventListener("jss-consent-saved", onConsent);
    return () => window.removeEventListener("jss-consent-saved", onConsent);
  }, [pathname]);

  return null;
}
