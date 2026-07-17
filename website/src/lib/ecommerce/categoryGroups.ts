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
  includes: string[];
};

export const ODOO_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    key: "surfboards",
    labelPt: "Pranchas",
    labelEn: "Surfboards",
    includes: ["SURFBOARDS"],
  },
  {
    key: "wetsuits",
    labelPt: "Fatos",
    labelEn: "Wetsuits",
    includes: ["WETSUITS"],
  },
  {
    key: "surfgear",
    labelPt: "Material Técnico",
    labelEn: "Surf Gear",
    includes: ["SURFGEAR"],
  },
  {
    key: "essentials",
    labelPt: "Essenciais",
    labelEn: "Essentials",
    includes: ["SURF ESSENCIALS", "SURF ESSENTIALS"],
  },
  {
    key: "bodyboard",
    labelPt: "Bodyboard",
    labelEn: "Bodyboard",
    includes: ["BODYBOARD"],
  },
  {
    key: "lifestyle",
    labelPt: "Lifestyle",
    labelEn: "Lifestyle",
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
  const normalizedCategory = normalizeCategoryText(category);
  const tokens = normalizeCategoryText(subcategory)
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  return tokens.every((token) => normalizedCategory.includes(token));
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
