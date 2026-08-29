import { fetchPublicInstagramMedia } from "@/lib/instagramPublic";

type InstagramMedia = {
  id: string;
  mediaUrl: string;
  permalink: string;
  caption?: string;
  mediaType?: string;
};

function envKey(handle: string, suffix: string) {
  return `INSTAGRAM_${handle.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${suffix}`;
}

const staticDudesMedia: InstagramMedia[] = [
  {
    id: "3766550636138336821",
    mediaUrl: "/brand/partners/dudes-post-1.jpg",
    permalink: "https://www.instagram.com/p/DRFedj3jBI1/",
  },
  {
    id: "3741106343957286859",
    mediaUrl: "/brand/partners/dudes-post-2.jpg",
    permalink: "https://www.instagram.com/p/DPrFGYKiM_L/",
  },
  {
    id: "3738826267194586160",
    mediaUrl: "/brand/partners/dudes-post-3.jpg",
    permalink: "https://www.instagram.com/p/DPi-q5NCHQw/",
  },
];

function clampMediaLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(6, Math.max(1, Math.floor(parsed)));
}

function mediaFromJson(handle: string, limit: number): InstagramMedia[] {
  const raw = process.env[envKey(handle, "MEDIA_JSON")];
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, limit) : [];
  } catch {
    return [];
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle } = await context.params;
  const limit = clampMediaLimit(new URL(request.url).searchParams.get("limit"));
  const configuredMedia = mediaFromJson(handle, limit);
  if (configuredMedia.length) {
    return Response.json({ configured: true, source: "env_json", media: configuredMedia });
  }

  const accountId = process.env[envKey(handle, "ACCOUNT_ID")];
  const accessToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
  if (!accountId || !accessToken) {
    const publicMedia = await fetchPublicInstagramMedia(handle, limit);
    if (publicMedia.length) {
      return Response.json({ configured: true, source: "instagram_public", media: publicMedia });
    }
    if (handle === "dudes_surfcafe") {
      return Response.json({ configured: true, source: "static_shortcode", media: staticDudesMedia.slice(0, limit) });
    }

    return Response.json({
      configured: false,
      source: "fallback",
      media: [],
      message: `Add ${envKey(handle, "ACCOUNT_ID")} and INSTAGRAM_GRAPH_ACCESS_TOKEN for live Instagram media.`,
    });
  }

  const url = new URL(`https://graph.facebook.com/v20.0/${accountId}/media`);
  url.searchParams.set("fields", "id,caption,media_type,media_url,permalink,thumbnail_url");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) {
    return Response.json({ configured: true, source: "instagram_graph", media: [], error: "instagram_fetch_failed" }, { status: 502 });
  }

  const data = await response.json();
  const media = Array.isArray(data.data)
    ? data.data.slice(0, limit).map((item: Record<string, string>) => ({
        id: item.id,
        caption: item.caption,
        mediaType: item.media_type,
        mediaUrl: item.thumbnail_url || item.media_url,
        permalink: item.permalink,
      }))
    : [];

  return Response.json({ configured: true, source: "instagram_graph", media });
}
