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

/** Menu leaf under a group — supports nested JSS Merch (CLOTHING / JSS MERCH / PANTS). */
function menuItemForGroup(normalizedPath: string, groupKey: CategoryGroupKey) {
  const parts = normalizedPath
    .split(" / ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  if (groupKey === "jssMerch") {
    const idx = parts.findIndex((part) => part.includes("JSS MERCH"));
    if (idx < 0) return null;
    const child = parts[idx + 1];
    if (!child) return null;
    return `JSS MERCH / ${child}`.toUpperCase();
  }

  if (groupKey === "clothing" && parts.some((part) => part.includes("JSS MERCH"))) {
    return null;
  }

  return secondLevelItem(normalizedPath);
}

function groupKeyForPath(normalizedPath: string): CategoryGroupKey | null {
  // Prefer JSS Merch over Clothing when the path still nests under Clothing.
  if (normalizedPath.includes("JSS MERCH")) return "jssMerch";

  const top = topLevelToken(normalizedPath);
  for (const group of ODOO_CATEGORY_GROUPS) {
    if (group.key === "jssMerch") continue;
    if (group.includes.some((token) => top.includes(token) || token.includes(top))) {
      return group.key;
    }
  }
  return null;
}

/**
 * Preferred top-menu subcategory order (Odoo path keys).
 * Unknown live items still appear after the preferred list, alphabetically.
 */
const MENU_SUBCATEGORY_ORDER: Partial<Record<CategoryGroupKey, string[]>> = {
  wetsuits: [
    "WETSUITS / MEN",
    "WETSUITS / WOMAN",
    "WETSUITS / WOMEN",
    "WETSUITS / JUNIOR",
    "WETSUITS / NEOPRENE ACESSORIES",
  ],
  surfgear: [
    "SURFGEAR / FINS",
    "SURFGEAR / DECKS",
    "SURFGEAR / LEASHES",
    "SURFGEAR / BOARDBAGS",
    "SURFGEAR / RACK",
    "SURFGEAR / CAR ACESSORIES",
  ],
  bodyboard: [
    "BODYBOARD / BOARDS",
    "BODYBOARD / LEASHES",
    "BODYBOARD / BAGS",
    "BODYBOARD / BOARDSOCKS",
    "BODYBOARD / FINS (PÉS DE PATO)",
    "BODYBOARD / FINS",
    "BODYBOARD / ACESSORIES",
  ],
  clothing: [
    "CLOTHING / MEN",
    "CLOTHING / WOMEN",
    "CLOTHING / WOMAN",
    "CLOTHING / KIDS",
    "CLOTHING / FOOTWEAR",
    "CLOTHING / HATS",
    "CLOTHING / SUNGLASSES",
    "CLOTHING / SOCKS",
    "FOOTWEAR / MEN",
    "FOOTWEAR / WOMEN",
  ],
  jssMerch: [
    "JSS MERCH / T-SHIRTS & TOPS",
    "JSS MERCH / SWEATERS & HOODIES",
    "JSS MERCH / SHORTS",
    "JSS MERCH / PANTS",
    "JSS MERCH / HATS",
    "JSS MERCH / SURF PONCHO",
  ],
};

function sortMenuItems(groupKey: CategoryGroupKey, items: string[]) {
  const preferred = MENU_SUBCATEGORY_ORDER[groupKey] || [];
  const rank = new Map(preferred.map((item, index) => [item, index]));
  return [...items].sort((a, b) => {
    const aRank = rank.has(a) ? rank.get(a)! : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b) ? rank.get(b)! : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b);
  });
}

export function buildMenuFromCategoryPaths(paths: string[]): MenuCategory[] {
  const itemsByGroup = new Map<CategoryGroupKey, Set<string>>();

  for (const path of paths) {
    const normalized = stripAllCategoryRoot(normalizeCategoryPath(path).toUpperCase());
    if (!normalized || normalized === "ALL") continue;
    const groupKey = groupKeyForPath(normalized);
    if (!groupKey) continue;
    // Surfskate stays shop-filterable but is hidden from the top menu.
    if (groupKey === "surfskate") continue;
    const item = menuItemForGroup(normalized, groupKey);
    if (!item) continue;
    if (!itemsByGroup.has(groupKey)) itemsByGroup.set(groupKey, new Set());
    itemsByGroup.get(groupKey)!.add(item);
  }

  return MENU_CATEGORIES.map((fallback) => {
    const dynamicItems = Array.from(itemsByGroup.get(fallback.key) || []);
    const ordered = dynamicItems.length
      ? sortMenuItems(fallback.key, dynamicItems)
      : sortMenuItems(fallback.key, fallback.items);
    return {
      key: fallback.key,
      anchor: fallback.anchor,
      items: ordered,
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
  return unstable_cache(buildMenuCategories, ["menu-categories-v6"], {
    revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
    tags: [CATALOG_CACHE_TAG],
  })();
}
