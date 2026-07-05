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

function mediaFromJson(handle: string): InstagramMedia[] {
  const raw = process.env[envKey(handle, "MEDIA_JSON")];
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle } = await context.params;
  const configuredMedia = mediaFromJson(handle);
  if (configuredMedia.length) {
    return Response.json({ configured: true, source: "env_json", media: configuredMedia });
  }

  const accountId = process.env[envKey(handle, "ACCOUNT_ID")];
  const accessToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
  if (!accountId || !accessToken) {
    return Response.json({
      configured: false,
      source: "fallback",
      media: [],
      message: `Add ${envKey(handle, "ACCOUNT_ID")} and INSTAGRAM_GRAPH_ACCESS_TOKEN for live Instagram media.`,
    });
  }

  const url = new URL(`https://graph.facebook.com/v20.0/${accountId}/media`);
  url.searchParams.set("fields", "id,caption,media_type,media_url,permalink,thumbnail_url");
  url.searchParams.set("limit", "6");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) {
    return Response.json({ configured: true, source: "instagram_graph", media: [], error: "instagram_fetch_failed" }, { status: 502 });
  }

  const data = await response.json();
  const media = Array.isArray(data.data)
    ? data.data.map((item: Record<string, string>) => ({
        id: item.id,
        caption: item.caption,
        mediaType: item.media_type,
        mediaUrl: item.thumbnail_url || item.media_url,
        permalink: item.permalink,
      }))
    : [];

  return Response.json({ configured: true, source: "instagram_graph", media });
}
