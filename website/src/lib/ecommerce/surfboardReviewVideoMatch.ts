import {
  haystackHasToken,
  matchSurfboardModel,
  normalizeSurfboardHaystack,
  SURFBOARD_BRAND_DEFAULTS,
} from "@/lib/ecommerce/surfboardModelCatalog";
import reviewVideoCache from "@/lib/ecommerce/surfboardReviewVideos.json";

export const SURFBOARD_REVIEW_CHANNELS = ["boardshopuk", "surfnshow", "realwatersports"] as const;

export type SurfboardReviewChannel = (typeof SURFBOARD_REVIEW_CHANNELS)[number];

export type SurfboardReviewVideo = {
  channel: SurfboardReviewChannel;
  videoId: string;
  title: string;
};

export const SURFBOARD_REVIEW_CHANNEL_META: Record<
  SurfboardReviewChannel,
  { name: string; url: string; handle: string }
> = {
  boardshopuk: {
    name: "Boardshop UK",
    url: "https://www.youtube.com/@BoardshopUK",
    handle: "BoardshopUK",
  },
  surfnshow: {
    name: "Surf n Show Reviews",
    url: "https://www.youtube.com/@surfnshowreviews7777",
    handle: "surfnshowreviews7777",
  },
  realwatersports: {
    name: "REAL Watersports",
    url: "https://www.youtube.com/@REALWatersports",
    handle: "REALWatersports",
  },
};

const DROP_WORDS = new Set([
  "the",
  "and",
  "surfboard",
  "surfboards",
  "board",
  "boards",
  "surf",
  "review",
  "reviews",
  "video",
  "watch",
  "official",
  "trailer",
]);

const CONSTRUCTION_AND_SPEC = new Set([
  "helium",
  "carbon",
  "epoxy",
  "ibolic",
  "timbertek",
  "lft",
  "xeon",
  "futures",
  "fcs",
  "thruster",
  "quad",
  "fins",
  "fin",
  "lite",
  "white",
  "black",
  "blue",
  "red",
  "green",
  "yellow",
  "orange",
  "pink",
  "grey",
  "gray",
  "cream",
  "sand",
  "purple",
  "silver",
  "gold",
]);

/** Single tokens that are too generic to identify a model without the brand. */
const GENERIC_ALONE = new Set([
  "fish",
  "pro",
  "plus",
  "air",
  "new",
  "model",
  "round",
  "egg",
  "gun",
  "log",
  "mid",
  "fun",
  "hybrid",
  "twin",
  "step",
  "shortboard",
  "longboard",
  "softboard",
  "roller",
  "ghost",
  "sunday",
  "range",
  "high",
  "box",
]);

const EXTRA_FOREIGN_BRANDS = [
  "slingshot",
  "naish",
  "fanatic",
  "duotone",
  "cabrinha",
  "pyzel",
  "pukas",
  "chilli",
  "rusty",
  "dhd",
  "js industries",
];

function brandGroupMatches(haystack: string, brandMatch: string[]) {
  return brandMatch.some((token) => {
    if (token.replace(/\s+/g, "").length < 4) return false;
    return haystackHasToken(haystack, token) || haystack.includes(token);
  });
}

function titleHasForeignBrand(titleHaystack: string, productHaystack: string) {
  for (const entry of SURFBOARD_BRAND_DEFAULTS) {
    if (!brandGroupMatches(titleHaystack, entry.brandMatch)) continue;
    if (brandGroupMatches(productHaystack, entry.brandMatch)) continue;
    return true;
  }
  for (const brand of EXTRA_FOREIGN_BRANDS) {
    if (brand.replace(/\s+/g, "").length < 4) continue;
    if (!haystackHasToken(titleHaystack, brand) && !titleHaystack.includes(brand)) continue;
    if (haystackHasToken(productHaystack, brand) || productHaystack.includes(brand)) continue;
    return true;
  }
  return false;
}

type ReviewProduct = {
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  brand?: string | null;
};

function isReviewChannel(value: string): value is SurfboardReviewChannel {
  return (SURFBOARD_REVIEW_CHANNELS as readonly string[]).includes(value);
}

export function cachedSurfboardReviewVideos(): SurfboardReviewVideo[] {
  const videos = Array.isArray(reviewVideoCache.videos) ? reviewVideoCache.videos : [];
  return videos.filter(
    (video): video is SurfboardReviewVideo =>
      Boolean(video) &&
      isReviewChannel(String(video.channel)) &&
      typeof video.videoId === "string" &&
      video.videoId.length >= 6 &&
      typeof video.title === "string" &&
      video.title.trim().length > 0
  );
}

export function stripSurfboardSpecNoise(text: string) {
  return text
    .replace(/\d+\s*['’]\s*\d+(?:\s*["”])?/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:ft|feet|litre|liter|l|kg|lbs?)\b/gi, " ")
    .replace(/\b\d+(?:\.\d+)?\b/g, " ");
}

export function distinctiveSurfboardModelTokens(
  brand?: string | null,
  name?: string | null,
  catalogMatch?: string[] | null
) {
  if (catalogMatch?.length) {
    return catalogMatch.map((token) => token.toLowerCase().trim()).filter(Boolean);
  }

  const cleanedName = stripSurfboardSpecNoise(name || "");
  const haystack = normalizeSurfboardHaystack(brand, cleanedName);
  const brandTokens = new Set(normalizeSurfboardHaystack(brand, "").split(/\s+/).filter(Boolean));

  return haystack.split(/\s+/).filter((token) => {
    if (!token || token.length < 3) return false;
    if (DROP_WORDS.has(token) || CONSTRUCTION_AND_SPEC.has(token)) return false;
    if (brandTokens.has(token)) return false;
    return true;
  });
}

export function stableChannelOrder(seed: string): SurfboardReviewChannel[] {
  const order = [...SURFBOARD_REVIEW_CHANNELS];
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let i = order.length - 1; i > 0; i -= 1) {
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    const j = (hash >>> 0) % (i + 1);
    const current = order[i]!;
    order[i] = order[j]!;
    order[j] = current;
  }
  return order;
}

function reviewSeed(product: ReviewProduct) {
  return String(product.id || product.slug || `${product.brand || ""} ${product.name || ""}`).trim() || "surfboard";
}

function titleScore(
  titleHaystack: string,
  tokens: string[],
  brandHaystack: string,
  productHaystack: string
) {
  if (!tokens.length) return null;
  if (!tokens.every((token) => haystackHasToken(titleHaystack, token))) return null;
  if (titleHasForeignBrand(titleHaystack, productHaystack)) return null;
  if (tokens.length === 1 && GENERIC_ALONE.has(tokens[0]!) && brandHaystack) {
    const brandTokens = brandHaystack.split(/\s+/).filter((token) => token.length >= 3);
    if (brandTokens.length && !brandTokens.some((token) => haystackHasToken(titleHaystack, token))) {
      return null;
    }
  }
  return tokens.reduce((sum, token) => sum + token.length, 0);
}

export function matchSurfboardReviewVideo(
  product: ReviewProduct,
  videos: SurfboardReviewVideo[] = cachedSurfboardReviewVideos()
): SurfboardReviewVideo | null {
  const model = matchSurfboardModel(product.brand, product.name);
  const tokens = distinctiveSurfboardModelTokens(product.brand, product.name, model?.match);
  if (!tokens.length) return null;

  const brandHaystack = normalizeSurfboardHaystack(product.brand, "");
  const productHaystack = normalizeSurfboardHaystack(product.brand, product.name);
  const order = stableChannelOrder(reviewSeed(product));

  for (const channel of order) {
    const passing = videos
      .filter((video) => video.channel === channel)
      .map((video) => {
        const titleHaystack = normalizeSurfboardHaystack("", video.title);
        return { video, score: titleScore(titleHaystack, tokens, brandHaystack, productHaystack) };
      })
      .filter((entry): entry is { video: SurfboardReviewVideo; score: number } => entry.score != null);

    if (!passing.length) continue;
    passing.sort(
      (a, b) => b.score - a.score || a.video.videoId.localeCompare(b.video.videoId)
    );
    return passing[0]!.video;
  }

  return null;
}

export function surfboardReviewWatchUrl(video: SurfboardReviewVideo | null) {
  return video ? `https://www.youtube.com/watch?v=${video.videoId}` : null;
}
