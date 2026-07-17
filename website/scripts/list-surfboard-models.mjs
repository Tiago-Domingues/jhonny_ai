import "dotenv/config";
import { createScriptPrismaClient } from "./prisma-client.mjs";

const prisma = createScriptPrismaClient();

function normalizeModel(brand, name) {
  let n = String(name || "")
    .toUpperCase()
    .replace(/^SURFBOARD\s+/i, "")
    .replace(/\d+['’]\d+["″]?/g, " ")
    .replace(/\d+\.\d+\s*L\b/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(
      /\b(FUTURES?|FCS\s*II?|FCS2|TRI|QUAD|TWIN|THRUSTER|5\s*FIN|3\s*FIN|ROUNDED\s*PIN|SQUASH|SWALLOW|ROUND|PIN)\b/g,
      " "
    )
    .replace(
      /\b(EPOXY|SOFT|SOFTBOARD|CARBON|HELIO|TIMBERTEK|LINEAR\s*FLEX|FUTUREFLEX|VOLCANIC|TIMBER|EPS|PU)\b/g,
      " "
    )
    .replace(
      /\b(CREAM|LILAC|PINK|MINT|GOLD|OLIVE|WHITE|BLACK|BLUE|RED|GREEN|ORANGE|YELLOW|INDIA)\b/g,
      " "
    )
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const b = String(brand || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  if (n.startsWith(`${b} `)) n = n.slice(b.length + 1).trim();
  n = n.replace(/\bHAYDENSHAPES\b/g, "").replace(/\s+/g, " ").trim();
  return { brand: b, model: n || "UNKNOWN" };
}

const rows = await prisma.product.findMany({
  where: {
    active: true,
    excludedFromCatalog: false,
    OR: [
      { category: { contains: "SURFBOARD", mode: "insensitive" } },
      { category: { contains: "PRANCHA", mode: "insensitive" } },
    ],
  },
  select: { name: true, brand: true, category: true, stockQuantity: true },
  orderBy: [{ brand: "asc" }, { name: "asc" }],
});

const map = new Map();
for (const row of rows) {
  const { brand, model } = normalizeModel(row.brand, row.name);
  const key = `${brand}::${model}`;
  if (!map.has(key)) {
    map.set(key, {
      brand,
      model,
      category: row.category,
      examples: [],
      count: 0,
      inStock: 0,
    });
  }
  const entry = map.get(key);
  entry.count += 1;
  if (row.stockQuantity > 0) entry.inStock += 1;
  if (entry.examples.length < 2) entry.examples.push(row.name);
}

const list = Array.from(map.values()).sort(
  (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model)
);

console.log(JSON.stringify({ products: rows.length, models: list.length, list }, null, 2));
await prisma.$disconnect();
