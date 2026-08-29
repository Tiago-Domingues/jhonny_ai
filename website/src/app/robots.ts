import type { MetadataRoute } from "next";
import { isSitePubliclyLaunched } from "@/lib/ecommerce/siteAccess";

const SITE = "https://www.jhonnysurfstore.pt";

export default function robots(): MetadataRoute.Robots {
  if (!isSitePubliclyLaunched()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/preview-access", "/conta/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
