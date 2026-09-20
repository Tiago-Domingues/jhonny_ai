import {
  productSitemapEntries,
  staticSitemapEntries,
  withSitemapCatalogFallback,
} from "../src/lib/ecommerce/sitemapEntries";
import { isSitePubliclyLaunched } from "../src/lib/ecommerce/siteAccess";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const previous = {
  comingSoon: process.env.SITE_COMING_SOON,
};

function restore() {
  if (previous.comingSoon == null) delete process.env.SITE_COMING_SOON;
  else process.env.SITE_COMING_SOON = previous.comingSoon;
}

async function main() {
  process.env.SITE_COMING_SOON = "true";
  assert(!isSitePubliclyLaunched(), "emergency lock hides the public sitemap");

  process.env.SITE_COMING_SOON = "";
  assert(isSitePubliclyLaunched(), "the live shop publishes a sitemap");

  const staticOnly = staticSitemapEntries();
  const urls = staticOnly.map((entry) => entry.url);
  assert(urls.includes("https://www.jhonnysurfstore.pt/"), "live sitemap includes the homepage");
  assert(urls.includes("https://www.jhonnysurfstore.pt/loja"), "live sitemap includes the shop");
  assert(
    staticOnly.every((entry) => !String(entry.url).includes("/loja/")),
    "static sitemap entries stay on marketing pages"
  );

  const products = productSitemapEntries([
    { slug: "jss-tee", updatedAt: new Date("2026-09-01T00:00:00.000Z") },
  ]);
  assert(products[0]?.url === "https://www.jhonnysurfstore.pt/loja/jss-tee", "product URLs use the shop slug");

  const recovered = await withSitemapCatalogFallback(async () => {
    throw new Error("unpaidPlanInvoice");
  });
  assert(recovered.length === 0, "Prisma/catalog failures degrade to an empty product list");

  const loaded = await withSitemapCatalogFallback(async () => [{ slug: "ok" }]);
  assert(loaded[0]?.slug === "ok", "successful catalog reads still pass through");

  console.log("sitemap helpers ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(restore);
