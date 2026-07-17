import { productMatchesCategoryGroup } from "@/lib/ecommerce/categoryGroups";
import {
  matchSurfboardBrandDefault,
  matchSurfboardModel,
} from "@/lib/ecommerce/surfboardModelCatalog";

type SurfboardProduct = {
  name: string;
  brand?: string | null;
  category: string;
};

function boardType(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("longboard") || lower.includes("log") || lower.includes("9'")) return "longboard";
  if (lower.includes("fish") || lower.includes("twin")) return "fish";
  if (lower.includes("soft") || lower.includes("foam")) return "softboard";
  if (lower.includes("mid") || lower.includes("fun") || lower.includes("egg")) return "mid-length";
  if (lower.includes("step") || lower.includes("gun")) return "step-up";
  if (lower.includes("hybrid") || lower.includes("daily") || lower.includes("everyday")) return "hybrid";
  return "performance surfboard";
}

function fallbackDescription(product: SurfboardProduct, type: string, brandLead?: string) {
  const brand = product.brand || "the shaper";
  const lead =
    brandLead ||
    `${product.name} is a ${type} from ${brand}, selected for surfers comparing outline, volume, rail feel, and everyday wave range before buying.`;
  return (
    `${lead} ` +
    "Stock, size, colour, and price on this page come from the Jhonny Surf Store Odoo catalog — confirm final dims and fin system in-store or with the team before you commit. " +
    "Watch the product video below for a model preview from the original brand or specialist surf media, then match the board to your weight and local Carcavelos / Lisbon wave range."
  );
}

export function buildSurfboardEnrichment(product: SurfboardProduct) {
  if (!productMatchesCategoryGroup(product.category, "surfboards")) return null;

  const model = matchSurfboardModel(product.brand, product.name);
  if (model) {
    return {
      marketingDescription: `${model.description} Stock, size, colour, and price on this page are the Jhonny Surf Store commercial source of truth — confirm final dims and fins with the team when you buy.`,
      videoUrl: model.videoUrl,
      contentSourceName: model.sourceName,
      contentSourceUrl: model.sourceUrl,
      contentUpdatedAt: new Date(),
      contentSyncStatus: "CATALOG_ENRICHED",
    };
  }

  const brandDefault = matchSurfboardBrandDefault(product.brand, product.name);
  const type = boardType(product.name);

  if (brandDefault) {
    return {
      marketingDescription: fallbackDescription(product, type, brandDefault.descriptionLead),
      videoUrl: brandDefault.videoUrl,
      contentSourceName: brandDefault.sourceName,
      contentSourceUrl: brandDefault.sourceUrl,
      contentUpdatedAt: new Date(),
      contentSyncStatus: "CATALOG_ENRICHED",
    };
  }

  const brand = product.brand || "the shaper";
  return {
    marketingDescription: fallbackDescription(product, type),
    videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${brand} ${product.name} surfboard`)}`,
    contentSourceName: "Jhonny Surf Store",
    contentSourceUrl: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards",
    contentUpdatedAt: new Date(),
    contentSyncStatus: "CATALOG_ENRICHED",
  };
}
