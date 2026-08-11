import "server-only";

import { unstable_cache } from "next/cache";
import { MENU_CATEGORIES, type NavKey } from "@/lib/i18n";
import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import { ODOO_CATEGORY_GROUPS, type CategoryGroupKey } from "@/lib/ecommerce/categoryGroups";
import { hasOdooConfig, OdooClient } from "@/lib/ecommerce/odooClient";

const MENU_CACHE_REVALIDATE_SECONDS = 60;
const MENU_CACHE_TAG = "menu-categories";

export type MenuSubcategory = {
  /** Full Odoo-style path used for filtering, e.g. "SURFGEAR / FINS / THRUSTER". */
  path: string;
  children: MenuSubcategory[];
};

export type MenuCategory = {
  key: NavKey;
  anchor: string;
  items: MenuSubcategory[];
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

function pathSegments(path: string) {
  return path
    .split(" / ")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Find immediate children under a parent path (supports nested JSS Merch windows). */
function buildChildrenUnder(parentPath: string, allPaths: string[]): MenuSubcategory[] {
  const parentParts = pathSegments(parentPath);
  if (!parentParts.length) return [];

  const childByName = new Map<string, string>();
  for (const candidate of allPaths) {
    const parts = pathSegments(candidate);
    if (parts.length <= parentParts.length) continue;

    for (let start = 0; start <= parts.length - parentParts.length; start++) {
      const matches = parentParts.every((part, index) => parts[start + index] === part);
      if (!matches) continue;
      const childIndex = start + parentParts.length;
      if (childIndex >= parts.length) break;
      const childName = parts[childIndex];
      if (!childByName.has(childName)) {
        childByName.set(childName, `${parentPath} / ${childName}`);
      }
      break;
    }
  }

  return Array.from(childByName.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, childPath]) => ({
      path: childPath,
      children: buildChildrenUnder(childPath, allPaths),
    }));
}

function toMenuSubcategories(paths: string[]): MenuSubcategory[] {
  return paths.map((path) => ({ path, children: [] }));
}

export function buildMenuFromCategoryPaths(paths: string[]): MenuCategory[] {
  const itemsByGroup = new Map<CategoryGroupKey, Set<string>>();
  const normalizedPaths: string[] = [];

  for (const path of paths) {
    const normalized = stripAllCategoryRoot(normalizeCategoryPath(path).toUpperCase());
    if (!normalized || normalized === "ALL") continue;
    normalizedPaths.push(normalized);
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
      items: ordered.map((path) => ({
        path,
        children: buildChildrenUnder(path, normalizedPaths),
      })),
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

/** Distinct category paths from active catalog products. */
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

async function buildMenuCategories(): Promise<MenuCategory[]> {
  const [odooPaths, productPaths] = await Promise.all([
    listOdooCategoryPaths(),
    listProductCategoryPaths(),
  ]);

  const merged = Array.from(new Set([...odooPaths, ...productPaths]));
  const built = buildMenuFromCategoryPaths(merged);

  // If everything failed, return the static fallback menu.
  const hasAnyItems = built.some((entry) => entry.items.length > 0);
  return hasAnyItems
    ? built
    : MENU_CATEGORIES.map((entry) => ({
        key: entry.key,
        anchor: entry.anchor,
        items: toMenuSubcategories(entry.items),
      }));
}

/**
 * Build top-nav categories from real Odoo `product.category` plus categories
 * present on synced products. Cached briefly so menu stays responsive.
 */
export async function listMenuCategories(): Promise<MenuCategory[]> {
  return unstable_cache(buildMenuCategories, ["menu-categories-v9"], {
    revalidate: MENU_CACHE_REVALIDATE_SECONDS,
    tags: [MENU_CACHE_TAG],
  })();
}
