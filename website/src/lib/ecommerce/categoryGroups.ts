export type CategoryGroupKey =
  | "surfboards"
  | "wetsuits"
  | "surfgear"
  | "essentials"
  | "bodyboard"
  | "clothing"
  | "jssMerch"
  | "travel"
  | "surfskate";

type CategoryGroup = {
  key: CategoryGroupKey;
  labelPt: string;
  labelEn: string;
  labelZh: string;
  includes: string[];
};

export const ODOO_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    key: "surfboards",
    labelPt: "Pranchas",
    labelEn: "Surfboards",
    labelZh: "冲浪板",
    includes: ["SURFBOARDS"],
  },
  {
    key: "wetsuits",
    labelPt: "Fatos",
    labelEn: "Wetsuits",
    labelZh: "潜水衣",
    includes: ["WETSUITS"],
  },
  {
    key: "surfgear",
    labelPt: "Material Técnico",
    labelEn: "Surf Gear",
    labelZh: "冲浪装备",
    includes: ["SURFGEAR"],
  },
  {
    key: "essentials",
    labelPt: "Surf Essencials",
    labelEn: "Surf Essencials",
    labelZh: "Surf Essencials",
    // Lifestyle is nested under Surf Essencials in Odoo.
    includes: ["SURF ESSENCIALS", "SURF ESSENTIALS"],
  },
  {
    key: "bodyboard",
    labelPt: "Bodyboard",
    labelEn: "Bodyboard",
    labelZh: "趴板",
    includes: ["BODYBOARD"],
  },
  {
    key: "clothing",
    labelPt: "Vestuário",
    labelEn: "Apparel",
    labelZh: "服装",
    // Footwear is nested under Clothing in Odoo; keep FOOTWEAR so root paths still match.
    // JSS Merch is its own top-level group (excluded in productMatchesCategoryGroup).
    includes: ["CLOTHING", "FOOTWEAR"],
  },
  {
    key: "jssMerch",
    labelPt: "JSS Merch",
    labelEn: "JSS Merch",
    labelZh: "JSS Merch",
    includes: ["JSS MERCH"],
  },
  {
    key: "travel",
    labelPt: "Viagem",
    labelEn: "Travel",
    labelZh: "旅行",
    includes: ["TRAVEL"],
  },
  {
    key: "surfskate",
    labelPt: "Surfskate",
    labelEn: "Surfskate",
    labelZh: "陆地冲浪",
    includes: ["SURFSKATE"],
  },
];

export function categoryGroupHref(group: CategoryGroupKey, extra?: Record<string, string>) {
  const params = new URLSearchParams({ categoryGroup: group, ...(extra || {}) });
  return `/loja?${params.toString()}`;
}

function normalizeCategoryText(value: string) {
  return value
    .replace(/\uFE0F/g, "")
    .split("/")
    .map((part) =>
      part
        .replace(/^[^A-Za-z0-9À-ÿ]+/, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join(" / ")
    .toUpperCase();
}

export function productMatchesCategoryGroup(category: string, groupKey?: string | null) {
  if (!groupKey) return true;
  const group = ODOO_CATEGORY_GROUPS.find((entry) => entry.key === groupKey);
  if (!group) return true;
  const normalized = normalizeCategoryText(category);

  // JSS Merch is its own menu group even when Odoo still nests it under Clothing.
  if (groupKey === "jssMerch") {
    return normalized.includes("JSS MERCH");
  }
  if (groupKey === "clothing" && normalized.includes("JSS MERCH")) {
    return false;
  }

  return group.includes.some((token) => normalized.includes(token));
}

export function productMatchesSubcategory(category: string, subcategory?: string | null) {
  if (!subcategory) return true;
  // Match path segments exactly so "MEN" does not also match "WOMEN".
  const categoryParts = normalizeCategoryText(category)
    .replace(/^ALL\s*\/\s*/, "")
    .split(" / ")
    .map((part) => part.trim())
    .filter(Boolean);
  const subcategoryParts = normalizeCategoryText(subcategory)
    .replace(/^ALL\s*\/\s*/, "")
    .split(" / ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!subcategoryParts.length || categoryParts.length < subcategoryParts.length) return false;
  // Prefix match (WETSUITS / MEN) or nested match (CLOTHING / JSS MERCH / PANTS ↔ JSS MERCH / PANTS).
  for (let start = 0; start <= categoryParts.length - subcategoryParts.length; start++) {
    if (subcategoryParts.every((part, index) => categoryParts[start + index] === part)) {
      return true;
    }
  }
  return false;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\bFin\b/g, "FIN")
    .replace(/\bFcs\b/g, "FCS")
    .replace(/\bYeti\b/g, "YETI");
}

export function displayOdooCategoryName(category: string) {
  const parts = category
    .split("/")
    .map((part) =>
      part
        .replace(/�/g, "")
        .replace(/^[^A-Za-z0-9À-ÿ]+/, "")
        .replace(/\bLENGHT\b/gi, "LENGTH")
        .replace(/\bACESSORIES\b/gi, "ACCESSORIES")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
  return titleCase(parts.at(-1) || category);
}
