import "server-only";

import { MENU_CATEGORIES, type NavKey } from "@/lib/i18n";
import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import { ODOO_CATEGORY_GROUPS, type CategoryGroupKey } from "@/lib/ecommerce/categoryGroups";
import { hasOdooConfig, OdooClient } from "@/lib/ecommerce/odooClient";

export type MenuCategory = {
  key: NavKey;
  anchor: string;
  items: string[];
};

/** Strip emoji / decorative prefixes so "👔 WETSUITS / MEN" → "WETSUITS / MEN". */
export function normalizeCategoryPath(category: string) {
  return category
    .replace(/\uFE0F/g, "")
    .replace(/^[^A-Za-z0-9À-ÿ]+/, "")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
}

function topLevelToken(normalizedPath: string) {
  return normalizedPath.split(" / ")[0]?.trim().toUpperCase() || "";
}

function secondLevelItem(normalizedPath: string) {
  const parts = normalizedPath
    .split(" / ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  // Menu shows group children (2nd level), e.g. WETSUITS / MEN
  return `${parts[0]} / ${parts[1]}`.toUpperCase();
}

function groupKeyForPath(normalizedPath: string): CategoryGroupKey | null {
  const top = topLevelToken(normalizedPath);
  for (const group of ODOO_CATEGORY_GROUPS) {
    if (group.includes.some((token) => top.includes(token) || token.includes(top))) {
      return group.key;
    }
  }
  return null;
}

export function buildMenuFromCategoryPaths(paths: string[]): MenuCategory[] {
  const itemsByGroup = new Map<CategoryGroupKey, Set<string>>();

  for (const path of paths) {
    const normalized = normalizeCategoryPath(path).toUpperCase();
    if (!normalized || normalized === "ALL" || normalized.startsWith("ALL /")) continue;
    const groupKey = groupKeyForPath(normalized);
    if (!groupKey) continue;
    const item = secondLevelItem(normalized);
    if (!item) continue;
    if (!itemsByGroup.has(groupKey)) itemsByGroup.set(groupKey, new Set());
    itemsByGroup.get(groupKey)!.add(item);
  }

  return MENU_CATEGORIES.map((fallback) => {
    const dynamicItems = Array.from(itemsByGroup.get(fallback.key) || []).sort((a, b) =>
      a.localeCompare(b)
    );
    return {
      key: fallback.key,
      anchor: fallback.anchor,
      // Prefer live Odoo-derived items; keep static fallback if Odoo returns nothing for that group.
      items: dynamicItems.length ? dynamicItems : fallback.items,
    };
  });
}

async function listOdooCategoryPaths(): Promise<string[]> {
  if (!hasOdooConfig()) return [];
  try {
    const client = new OdooClient();
    await client.authenticate();
    const rows = await client.searchRead(
      "product.category",
      [],
      ["complete_name", "name"],
      { limit: 500, order: "complete_name" }
    );
    return rows
      .map((row) => String(row.complete_name || row.name || ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Distinct category paths only — avoids loading the full product catalog for the header menu. */
async function listProductCategoryPaths(): Promise<string[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = await prisma.product.findMany({
      where: { active: true, excludedFromCatalog: false },
      select: { category: true },
      distinct: ["category"],
    });
    return rows.map((row) => row.category).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Build top-nav categories from real Odoo `product.category` plus categories
 * present on synced/live products (so newly used paths are never missing).
 */
export async function listMenuCategories(): Promise<MenuCategory[]> {
  const [odooPaths, productPaths] = await Promise.all([
    listOdooCategoryPaths(),
    listProductCategoryPaths(),
  ]);

  const merged = Array.from(new Set([...odooPaths, ...productPaths]));
  const built = buildMenuFromCategoryPaths(merged);

  // If everything failed, return the static fallback menu.
  const hasAnyItems = built.some((entry) => entry.items.length > 0);
  return hasAnyItems ? built : MENU_CATEGORIES.map((entry) => ({ ...entry }));
}
