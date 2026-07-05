import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: process.env.DATABASE_URL || "file:./prisma/dev.db",
  }),
});

const surfboardTerms = ["surfboard", "surfboards", "prancha", "shortboard", "longboard", "softboard", "bodyboard"];

const brandSources = {
  firewire: ["Firewire Surfboards", "https://firewiresurfboards.com/"],
  "slater designs": ["Slater Designs", "https://slaterdesigns.com/"],
  "channel islands": ["Channel Islands Surfboards", "https://cisurfboards.com/"],
  "al merrick": ["Channel Islands Surfboards", "https://cisurfboards.com/"],
  lost: ["Lost Surfboards", "https://lostsurfboards.net/"],
  mayhem: ["Lost Surfboards", "https://lostsurfboards.net/"],
  pukas: ["Pukas Surf", "https://pukassurf.com/"],
  "sharp eye": ["Sharp Eye Surfboards", "https://sharpeyesurfboards.com/"],
  pyzel: ["Pyzel Surfboards", "https://pyzelsurfboards.com/"],
  torq: ["Torq Surfboards", "https://www.torq-surfboards.com/"],
  nsp: ["NSP Surfboards", "https://www.nspsurfboards.com/"],
  softech: ["Softech Softboards", "https://www.softechsoftboards.com/"],
  indio: ["Indio Surfboards", "https://indiosurfboards.com/"],
  "js industries": ["JS Industries", "https://jsindustries.com/"],
};

function includesSurfboardCategory(category) {
  const lower = String(category || "").toLowerCase();
  return surfboardTerms.some((term) => lower.includes(term));
}

function boardType(name) {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("longboard") || lower.includes("log")) return "longboard";
  if (lower.includes("fish") || lower.includes("twin")) return "fish";
  if (lower.includes("soft") || lower.includes("foam")) return "softboard";
  if (lower.includes("mid") || lower.includes("fun")) return "mid-length";
  if (lower.includes("step") || lower.includes("gun")) return "step-up";
  if (lower.includes("hybrid") || lower.includes("daily") || lower.includes("everyday")) return "hybrid";
  return "performance surfboard";
}

function sourceFor(product) {
  const brand = String(product.brand || "").toLowerCase();
  const match = Object.entries(brandSources).find(([key]) => brand.includes(key));
  if (match) return { contentSourceName: match[1][0], contentSourceUrl: match[1][1] };
  return {
    contentSourceName: "Boardshop UK search",
    contentSourceUrl: `https://www.boardshop.co.uk/catalogsearch/result/?q=${encodeURIComponent(`${product.brand || ""} ${product.name}`.trim())}`,
  };
}

function enrichmentFor(product) {
  const source = sourceFor(product);
  const brand = product.brand || "the shaper";
  return {
    marketingDescription:
      `${product.name} is a ${boardType(product.name)} from ${brand}, selected for surfers comparing outline, volume, rail feel, and everyday wave range before buying. ` +
      "Use the original Odoo stock, size, color, and price details as the commercial source of truth, then confirm model-specific construction and ride notes with the linked brand or specialist surf-shop source.",
    videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${brand} ${product.name} surfboard review`)}`,
    ...source,
    contentUpdatedAt: new Date(),
    contentSyncStatus: "AUTO_ENRICHED",
  };
}

async function main() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      excludedFromCatalog: false,
      stockQuantity: { gt: 0 },
    },
    select: { id: true, name: true, brand: true, category: true },
  });

  const surfboards = products.filter((product) => includesSurfboardCategory(product.category));
  for (const product of surfboards) {
    await prisma.product.update({
      where: { id: product.id },
      data: enrichmentFor(product),
    });
  }

  console.log(`Enriched ${surfboards.length} in-stock surfboard products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
