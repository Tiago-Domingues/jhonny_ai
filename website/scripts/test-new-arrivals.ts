import { readFileSync } from "node:fs";
import path from "node:path";
import { isNewArrivalsCategory, selectNewArrivalProducts } from "../src/lib/ecommerce/catalogNewIn";
import { isNewInAttributeName, isNegativeNewInValue } from "../src/lib/ecommerce/odooCatalogNewIn";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  const tagged = { id: "tagged", name: "Tagged New In", category: "SURFBOARDS", isNewIn: true, createdAt: "2024-01-01T00:00:00.000Z" };
  const newest = { id: "newest", name: "Newest public", category: "SURFBOARDS", isNewIn: false, createdAt: "2026-09-01T00:00:00.000Z" };
  const older = { id: "older", name: "Older public", category: "SURFBOARDS", isNewIn: false, createdAt: "2025-01-01T00:00:00.000Z" };
  const categoryHit = {
    id: "cat",
    name: "Novidades path",
    category: "NOVIDADES / DROPS",
    isNewIn: false,
    createdAt: "2020-01-01T00:00:00.000Z",
  };

  const fromTagged = selectNewArrivalProducts([newest, older, tagged], 8);
  assert(fromTagged[0]?.id === "tagged", "tagged New In wins over newest products");
  assert(fromTagged.every((product) => product.isNewIn), "tagged list stays tagged-only");

  const fromCategory = selectNewArrivalProducts([newest, older, categoryHit], 8);
  assert(fromCategory[0]?.id === "cat", "New In category wins when no tags");
  assert(isNewArrivalsCategory("New In"), "New In category matches");
  assert(isNewArrivalsCategory("Novidades"), "Novidades category matches");

  const fromNewest = selectNewArrivalProducts([older, newest], 8);
  assert(fromNewest[0]?.id === "newest", "empty tags and categories fall back to newest createdAt");
  assert(fromNewest.map((product) => product.id).join(",") === "newest,older", "newest-first fallback order");

  assert(isNewInAttributeName("NEW IN"), "NEW IN attribute name matches");
  assert(isNewInAttributeName("Novidades"), "Novidades attribute name matches");
  assert(isNewInAttributeName("New Arrival"), "New Arrival attribute name matches");
  assert(isNegativeNewInValue("Não"), "Não is not a New In tag");
  assert(isNegativeNewInValue("No"), "No is not a New In tag");
  assert(!isNegativeNewInValue("Sim"), "Sim stays a New In value");

  const catalog = readFileSync(path.resolve(__dirname, "../src/lib/ecommerce/catalog.ts"), "utf8");
  const newInFn = catalog.slice(catalog.indexOf("export async function listNewArrivalProducts"));
  assert(newInFn.includes('orderBy: [{ createdAt: "desc" }'), "DB path queries newest products when tags are empty");
  assert(!newInFn.includes("listAllCatalogProducts("), "New In listing avoids a full catalog scan");

  console.log("new arrivals selection ok");
}

main();
