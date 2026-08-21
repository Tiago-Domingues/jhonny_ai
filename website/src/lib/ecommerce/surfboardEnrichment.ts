import { productMatchesCategoryGroup } from "@/lib/ecommerce/categoryGroups";
import {
  matchSurfboardBrandDefault,
  matchSurfboardModel,
} from "@/lib/ecommerce/surfboardModelCatalog";
import {
  matchSurfboardReviewVideo,
  SURFBOARD_REVIEW_CHANNEL_META,
  surfboardReviewWatchUrl,
} from "@/lib/ecommerce/surfboardReviewVideoMatch";

type SurfboardProduct = {
  id?: string | null;
  slug?: string | null;
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
  const brandDefault = matchSurfboardBrandDefault(product.brand, product.name);
  const type = boardType(product.name);
  const review = matchSurfboardReviewVideo(product);
  const videoUrl = surfboardReviewWatchUrl(review);
  const reviewMeta = review ? SURFBOARD_REVIEW_CHANNEL_META[review.channel] : null;

  const descriptionSource = model
    ? { name: model.sourceName, url: model.sourceUrl }
    : brandDefault
      ? { name: brandDefault.sourceName, url: brandDefault.sourceUrl }
      : {
          name: "Jhonny Surf Store",
          url: "https://www.jhonnysurfstore.com/loja?categoryGroup=surfboards",
        };

  const marketingDescription = model
    ? `${model.description} Stock, size, colour, and price on this page are the Jhonny Surf Store commercial source of truth — confirm final dims and fins with the team when you buy.`
    : fallbackDescription(product, type, brandDefault?.descriptionLead);

  return {
    marketingDescription,
    videoUrl,
    contentSourceName: reviewMeta?.name || descriptionSource.name,
    contentSourceUrl: reviewMeta?.url || descriptionSource.url,
    contentUpdatedAt: new Date(),
    contentSyncStatus: "CATALOG_ENRICHED",
  };
}
