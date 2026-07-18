export type CategoryGroupKey =
  | "surfboards"
  | "wetsuits"
  | "surfgear"
  | "essentials"
  | "bodyboard"
  | "lifestyle";

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
    labelPt: "Essenciais",
    labelEn: "Essentials",
    labelZh: "必备用品",
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
    key: "lifestyle",
    labelPt: "Lifestyle",
    labelEn: "Lifestyle",
    labelZh: "生活方式",
    includes: ["LIFESTYLE"],
  },
];

export function categoryGroupHref(group: CategoryGroupKey, extra?: Record<string, string>) {
  const params = new URLSearchParams({ categoryGroup: group, ...(extra || {}) });
  return `/loja?${params.toString()}`;
}

function normalizeCategoryText(value: string) {
  return value
    .replace(/�/g, "")
    .replace(/^[^A-Za-z0-9À-ÿ]+/, "")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function productMatchesCategoryGroup(category: string, groupKey?: string | null) {
  if (!groupKey) return true;
  const group = ODOO_CATEGORY_GROUPS.find((entry) => entry.key === groupKey);
  if (!group) return true;
  const normalized = normalizeCategoryText(category);
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
  return subcategoryParts.every((part, index) => categoryParts[index] === part);
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
        .replace(/\bESSENCIALS\b/gi, "ESSENTIALS")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
  return titleCase(parts.at(-1) || category);
}
