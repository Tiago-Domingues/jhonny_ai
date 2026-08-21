/**
 * Offline check: surfboard review videos only embed when the model name
 * is clearly in a BoardshopUK / Surf n Show / REAL Watersports title.
 * Run: cd website && npm run test:surfboard-videos
 */
import { applySurfboardReviewVideo, buildSurfboardEnrichment } from "../src/lib/ecommerce/surfboardEnrichment";
import {
  distinctiveSurfboardModelTokens,
  matchSurfboardReviewVideo,
  stableChannelOrder,
  type SurfboardReviewVideo,
} from "../src/lib/ecommerce/surfboardReviewVideoMatch";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const videos: SurfboardReviewVideo[] = [
  {
    channel: "boardshopuk",
    videoId: "seaside-uk",
    title: "Firewire Seaside by Rob Machado | Surfboard Review",
  },
  {
    channel: "realwatersports",
    videoId: "firewire-range",
    title: "Firewire Surfboards 2024 Range Overview",
  },
  {
    channel: "surfnshow",
    videoId: "generic-review",
    title: "Surfboard Review — best shortboards this year",
  },
  {
    channel: "realwatersports",
    videoId: "seaside-real",
    title: "Rob Machado Seaside Review at REAL Watersports",
  },
  {
    channel: "boardshopuk",
    videoId: "better-everyday",
    title: "Channel Islands Better Everyday Surfboard Review",
  },
];

const seaside = matchSurfboardReviewVideo(
  { id: "p1", slug: "firewire-seaside", brand: "Firewire", name: "Seaside 5'10 Helium" },
  videos
);
assert(seaside, "confident Seaside title is a hit");
assert(
  seaside?.videoId === "seaside-uk" || seaside?.videoId === "seaside-real",
  "Seaside match comes from a title that includes the model"
);

const brandOnly = matchSurfboardReviewVideo(
  { id: "p2", brand: "Firewire", name: "Seaside 5'10" },
  [
    {
      channel: "boardshopuk",
      videoId: "fw-only",
      title: "Firewire Surfboards Review",
    },
  ]
);
assert(brandOnly === null, "brand-only title is rejected");

const foreignBrand = matchSurfboardReviewVideo(
  { id: "lost-rnf", brand: "Lost", name: "Round Nose Fish 5'8" },
  [
    {
      channel: "boardshopuk",
      videoId: "fw-rnf",
      title: "Firewire Surfboards Round Nose Fish Surfboard Review",
    },
  ]
);
assert(foreignBrand === null, "another brand's same model name is rejected");

const wrongRoller = matchSurfboardReviewVideo(
  { id: "softech-roller", brand: "Softech", name: "Roller 8'0" },
  [
    {
      channel: "realwatersports",
      videoId: "high-roller",
      title: "2019 Slingshot High Roller",
    },
  ]
);
assert(wrongRoller === null, "unrelated product that shares a generic token is rejected");

const noMatch = matchSurfboardReviewVideo(
  { id: "p3", brand: "Lost", name: "Round Nose Fish 5'8" },
  videos
);
assert(noMatch === null, "no-match returns null");

const tokens = distinctiveSurfboardModelTokens("Firewire", "Seaside 5'10 Helium FCS White");
assert(tokens.includes("seaside"), "model token kept");
assert(!tokens.includes("firewire"), "brand token dropped");
assert(!tokens.includes("helium"), "construction token dropped");
assert(!tokens.some((token) => /^\d+$/.test(token)), "size numbers dropped");

const catalogHit = matchSurfboardReviewVideo(
  { id: "ci-be", brand: "Channel Islands", name: "Better Everyday 6'0" },
  videos
);
assert(catalogHit?.videoId === "better-everyday", "catalog match[] tokens must appear in the title");

const orderA = stableChannelOrder("product-a").join(",");
const orderB = stableChannelOrder("product-a").join(",");
assert(orderA === orderB, "channel mix is stable for the same product");
assert(new Set(stableChannelOrder("product-a")).size === 3, "all three channels are in the mix");

const seasideA = matchSurfboardReviewVideo(
  { id: "alpha", brand: "Firewire", name: "Seaside" },
  videos
);
const seasideB = matchSurfboardReviewVideo(
  { id: "alpha", brand: "Firewire", name: "Seaside" },
  videos
);
assert(seasideA?.videoId === seasideB?.videoId, "same product keeps the same video");

const enrichmentHit = buildSurfboardEnrichment({
  id: "p1",
  slug: "firewire-seaside",
  name: "Seaside 5'10",
  brand: "Firewire",
  category: "SURFBOARDS",
});
assert(enrichmentHit, "surfboard category still enriches descriptions");
assert(
  enrichmentHit!.marketingDescription.toLowerCase().includes("seaside") ||
    enrichmentHit!.marketingDescription.toLowerCase().includes("machado"),
  "catalog/fallback description is kept"
);

const enrichmentMiss = buildSurfboardEnrichment({
  id: "no-video",
  name: "Completely Fictional Model 5'10",
  brand: "NoSuchShaper",
  category: "SURFBOARDS",
});
assert(enrichmentMiss, "unmatched boards still get a description");
assert(enrichmentMiss!.videoUrl === null, "unmatched boards do not get a search URL or brand clip");
assert(
  !String(enrichmentMiss!.videoUrl || "").includes("youtube.com/results"),
  "search URLs are never written"
);

const overlaid = applySurfboardReviewVideo({
  id: "stored-wrong",
  name: "Completely Fictional Model 5'10",
  brand: "NoSuchShaper",
  category: "SURFBOARDS",
  videoUrl: "https://www.youtube.com/watch?v=brandDefaultClip",
});
assert(overlaid.videoUrl === null, "stored brand-default clips are cleared without a confident title match");

console.log("surfboard review video matcher: ok");
