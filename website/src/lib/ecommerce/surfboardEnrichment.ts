import { productMatchesCategoryGroup } from "@/lib/ecommerce/categoryGroups";

type SurfboardProduct = {
  name: string;
  brand?: string | null;
  category: string;
};

const brandSources: Record<string, { sourceName: string; sourceUrl: string }> = {
  firewire: { sourceName: "Firewire Surfboards", sourceUrl: "https://firewiresurfboards.com/" },
  "slater designs": { sourceName: "Slater Designs", sourceUrl: "https://slaterdesigns.com/" },
  "channel islands": { sourceName: "Channel Islands Surfboards", sourceUrl: "https://cisurfboards.com/" },
  "al merrick": { sourceName: "Channel Islands Surfboards", sourceUrl: "https://cisurfboards.com/" },
  lost: { sourceName: "Lost Surfboards", sourceUrl: "https://lostsurfboards.net/" },
  mayhem: { sourceName: "Lost Surfboards", sourceUrl: "https://lostsurfboards.net/" },
  pukas: { sourceName: "Pukas Surf", sourceUrl: "https://pukassurf.com/" },
  "sharp eye": { sourceName: "Sharp Eye Surfboards", sourceUrl: "https://sharpeyesurfboards.com/" },
  pyzel: { sourceName: "Pyzel Surfboards", sourceUrl: "https://pyzelsurfboards.com/" },
  torq: { sourceName: "Torq Surfboards", sourceUrl: "https://www.torq-surfboards.com/" },
  nsp: { sourceName: "NSP Surfboards", sourceUrl: "https://www.nspsurfboards.com/" },
  softech: { sourceName: "Softech Softboards", sourceUrl: "https://www.softechsoftboards.com/" },
  indio: { sourceName: "Indio Surfboards", sourceUrl: "https://indiosurfboards.com/" },
  "js industries": { sourceName: "JS Industries", sourceUrl: "https://jsindustries.com/" },
};

function normalized(value?: string | null) {
  return (value || "").toLowerCase();
}

function brandSource(product: SurfboardProduct) {
  const brand = normalized(product.brand);
  const hit = Object.entries(brandSources).find(([key]) => brand.includes(key));
  if (hit) return hit[1];

  return {
    sourceName: "Boardshop UK search",
    sourceUrl: `https://www.boardshop.co.uk/catalogsearch/result/?q=${encodeURIComponent(`${product.brand || ""} ${product.name}`.trim())}`,
  };
}

function boardType(name: string) {
  const lower = normalized(name);
  if (lower.includes("longboard") || lower.includes("log")) return "longboard";
  if (lower.includes("fish") || lower.includes("twin")) return "fish";
  if (lower.includes("soft") || lower.includes("foam")) return "softboard";
  if (lower.includes("mid") || lower.includes("fun")) return "mid-length";
  if (lower.includes("step") || lower.includes("gun")) return "step-up";
  if (lower.includes("hybrid") || lower.includes("daily") || lower.includes("everyday")) return "hybrid";
  return "performance surfboard";
}

export function buildSurfboardEnrichment(product: SurfboardProduct) {
  if (!productMatchesCategoryGroup(product.category, "surfboards")) return null;

  const source = brandSource(product);
  const type = boardType(product.name);
  const brand = product.brand || "the shaper";
  const searchTerms = `${brand} ${product.name} surfboard review`;

  return {
    marketingDescription:
      `${product.name} is a ${type} from ${brand}, selected for surfers comparing outline, volume, rail feel, and everyday wave range before buying. ` +
      "Use the original Odoo stock, size, color, and price details above as the commercial source of truth, then confirm model-specific construction and ride notes with the linked brand or specialist surf-shop source.",
    videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerms)}`,
    contentSourceName: source.sourceName,
    contentSourceUrl: source.sourceUrl,
    contentUpdatedAt: new Date(),
    contentSyncStatus: "AUTO_ENRICHED",
  };
}
