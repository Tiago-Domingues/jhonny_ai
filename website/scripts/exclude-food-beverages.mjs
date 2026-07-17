import "dotenv/config";
import { createScriptPrismaClient } from "./prisma-client.mjs";

const prisma = createScriptPrismaClient();

const blockedTerms = [
  "dudes",
  "cafe",
  "café",
  "coffee",
  "cerveja",
  "beer",
  "food",
  "bebida",
  "beverage",
  "snack",
  "pastel",
  "bolo",
  "cake",
  "menu",
  "croissant",
  "tosta",
  "sandwich",
  "sandes",
  "sumo",
  "juice",
  "wine",
  "vinho",
];

function shouldExclude(product) {
  const haystack = `${product.name} ${product.category} ${product.brand || ""}`.toLowerCase();
  return blockedTerms.some((term) => haystack.includes(term));
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, category: true, brand: true },
  });
  const blockedIds = products.filter(shouldExclude).map((product) => product.id);

  if (blockedIds.length) {
    await prisma.product.updateMany({
      where: { id: { in: blockedIds } },
      data: {
        excludedFromCatalog: true,
        exclusionReason: "Food/beverage product excluded from website catalog.",
      },
    });
  }

  console.log(`Excluded ${blockedIds.length} food/beverage products from the website catalog.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
