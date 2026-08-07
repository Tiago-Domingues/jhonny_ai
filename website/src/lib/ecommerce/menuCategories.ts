import "server-only";

import { unstable_cache } from "next/cache";
import { MENU_CATEGORIES, type NavKey } from "@/lib/i18n";
import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import {
  CATALOG_CACHE_REVALIDATE_SECONDS,
  CATALOG_CACHE_TAG,
  getCachedActiveCatalog,
} from "@/lib/ecommerce/catalog";
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
    .split("/")
    .map((part) =>
      part
        .replace(/^[^A-Za-z0-9À-ÿ]+/, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join(" / ");
}

/** Odoo `complete_name` often starts with the root "All / …" — drop that for menu grouping. */
export function stripAllCategoryRoot(normalizedPath: string) {
  return normalizedPath.replace(/^ALL\s*\/\s*/i, "").trim();
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
    const normalized = stripAllCategoryRoot(normalizeCategoryPath(path).toUpperCase());
    if (!normalized || normalized === "ALL") continue;
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

/** Distinct category paths from the cached product catalog (no extra Prisma findMany). */
async function listProductCategoryPaths(): Promise<string[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const products = await getCachedActiveCatalog();
    return Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
  } catch {
    return [];
  }
}

async function buildMenuCategories(): Promise<MenuCategory[]> {
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

/**
 * Build top-nav categories from real Odoo `product.category` plus categories
 * present on synced products. Cached + tag-revalidated with the catalog after sync.
 */
export async function listMenuCategories(): Promise<MenuCategory[]> {
  return unstable_cache(buildMenuCategories, ["menu-categories-v3"], {
    revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
    tags: [CATALOG_CACHE_TAG],
  })();
}
