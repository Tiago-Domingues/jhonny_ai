/**
 * Apply curated surfboard descriptions + YouTube preview URLs to every
 * active SURFBOARDS product. Run: npx tsx scripts/enrich-surfboards.mjs
 */
import "dotenv/config";
import { createScriptPrismaClient } from "./prisma-client.mjs";
import { buildSurfboardEnrichment } from "../src/lib/ecommerce/surfboardEnrichment.ts";
import { productMatchesCategoryGroup } from "../src/lib/ecommerce/categoryGroups.ts";
import { matchSurfboardModel } from "../src/lib/ecommerce/surfboardModelCatalog.ts";

const prisma = createScriptPrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      excludedFromCatalog: false,
    },
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      slug: true,
    },
  });

  const surfboards = products.filter((product) =>
    productMatchesCategoryGroup(product.category, "surfboards")
  );

  let modelHits = 0;
  let updated = 0;
  const unmatched = [];

  for (const product of surfboards) {
    const enrichment = buildSurfboardEnrichment(product);
    if (!enrichment) continue;

    const model = matchSurfboardModel(product.brand, product.name);
    if (model) modelHits += 1;
    else unmatched.push(`${product.brand || "?"} | ${product.name}`);

    await prisma.product.update({
      where: { id: product.id },
      data: enrichment,
    });
    updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        surfboards: surfboards.length,
        updated,
        modelCatalogHits: modelHits,
        unmatchedSample: unmatched.slice(0, 25),
        unmatchedCount: unmatched.length,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
