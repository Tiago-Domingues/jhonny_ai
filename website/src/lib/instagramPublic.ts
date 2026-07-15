import { request } from "node:https";

type InstagramUser = {
  profile_pic_url?: unknown;
  profile_pic_url_hd?: unknown;
  edge_owner_to_timeline_media?: {
    edges?: Array<{
      node?: InstagramMediaNode;
    }>;
  };
};

type InstagramMediaNode = {
  id?: unknown;
  shortcode?: unknown;
  display_url?: unknown;
  thumbnail_src?: unknown;
  is_video?: unknown;
  edge_media_to_caption?: {
    edges?: Array<{
      node?: {
        text?: unknown;
      };
    }>;
  };
};

type InstagramProfile = {
  data?: {
    user?: InstagramUser;
  };
};

export type PublicInstagramMedia = {
  id: string;
  mediaUrl: string;
  permalink: string;
  caption?: string;
  mediaType?: string;
};

const instagramHeaders = {
  Accept: "application/json,text/plain,*/*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
  "X-IG-App-ID": "936619743392459",
};

const imageHeaders = {
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
};

const profileCache = new Map<string, { profile: InstagramProfile; expiresAt: number }>();
const profileCacheMs = 60 * 60 * 1000;

export function normalizeInstagramHandle(handle: string) {
  const username = handle.replace(/^@/, "").trim();
  return /^[a-zA-Z0-9._]+$/.test(username) ? username : null;
}

function fetchJsonInDevelopment(url: URL, headers: Record<string, string>) {
  return new Promise<unknown | null>((resolve) => {
    const req = request(
      url,
      {
        headers,
        rejectUnauthorized: false,
      },
      (res) => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          resolve(null);
          return;
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(null);
          }
        });
      }
    );

    req.setTimeout(8000, () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

function fetchImageInDevelopment(url: URL, redirects = 0) {
  return new Promise<{ body: Buffer; contentType: string } | null>((resolve) => {
    const req = request(
      url,
      {
        headers: imageHeaders,
        rejectUnauthorized: false,
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects < 4
        ) {
          res.resume();
          resolve(fetchImageInDevelopment(new URL(res.headers.location, url), redirects + 1));
          return;
        }

        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on("end", () => {
          resolve({
            body: Buffer.concat(chunks),
            contentType: res.headers["content-type"] || "image/jpeg",
          });
        });
      }
    );

    req.setTimeout(8000, () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

async function fetchJson(url: URL) {
  if (process.env.NODE_ENV === "development") {
    return fetchJsonInDevelopment(url, instagramHeaders);
  }

  return fetch(url, {
    headers: instagramHeaders,
    next: { revalidate: 900 },
  }).then((response) => (response.ok ? response.json() : null));
}

export async function fetchPublicInstagramProfile(handle: string) {
  const username = normalizeInstagramHandle(handle);
  if (!username) return null;

  const cached = profileCache.get(username);
  if (cached && cached.expiresAt > Date.now()) return cached.profile;

  const url = new URL("https://www.instagram.com/api/v1/users/web_profile_info/");
  url.searchParams.set("username", username);

  try {
    const profile = (await fetchJson(url)) as InstagramProfile | null;
    if (profile?.data?.user) {
      profileCache.set(username, {
        profile,
        expiresAt: Date.now() + profileCacheMs,
      });
      return profile;
    }
  } catch {
    // Keep stale successful data if Instagram temporarily throttles anonymous requests.
  }

  return cached?.profile || null;
}

export function avatarUrlFromProfile(profile: InstagramProfile | null) {
  const avatarUrl =
    profile?.data?.user?.profile_pic_url_hd ||
    profile?.data?.user?.profile_pic_url;
  return typeof avatarUrl === "string" ? avatarUrl : null;
}

export async function fetchPublicInstagramAvatarUrl(handle: string) {
  return avatarUrlFromProfile(await fetchPublicInstagramProfile(handle));
}

function timelineNodes(profile: InstagramProfile | null) {
  const edges = profile?.data?.user?.edge_owner_to_timeline_media?.edges;
  if (!Array.isArray(edges)) return [];
  return edges.map((edge) => edge.node).filter(Boolean) as InstagramMediaNode[];
}

export function mediaFromProfile(profile: InstagramProfile | null, handle: string, limit = 3): PublicInstagramMedia[] {
  const username = normalizeInstagramHandle(handle);
  if (!username) return [];

  return timelineNodes(profile)
    .map((node) => {
      const shortcode = typeof node.shortcode === "string" ? node.shortcode : "";
      if (!shortcode) return null;

      const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text;
      return {
        id: typeof node.id === "string" ? node.id : shortcode,
        caption: typeof caption === "string" ? caption : undefined,
        mediaType: node.is_video ? "VIDEO" : "IMAGE",
        mediaUrl: `/api/instagram/${encodeURIComponent(username)}/media/${encodeURIComponent(shortcode)}`,
        permalink: `https://www.instagram.com/p/${shortcode}/`,
      };
    })
    .filter(Boolean)
    .slice(0, limit) as PublicInstagramMedia[];
}

export async function fetchPublicInstagramMedia(handle: string, limit = 3) {
  return mediaFromProfile(await fetchPublicInstagramProfile(handle), handle, limit);
}

export async function fetchPublicInstagramImage(imageUrl: string) {
  const url = new URL(imageUrl);

  if (process.env.NODE_ENV === "development") {
    return fetchImageInDevelopment(url);
  }

  const response = await fetch(url, {
    headers: imageHeaders,
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;

  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "image/jpeg",
  };
}

export async function fetchPublicInstagramMediaImage(handle: string, shortcode: string) {
  const profile = await fetchPublicInstagramProfile(handle);
  const node = timelineNodes(profile).find((item) => item.shortcode === shortcode);
  const imageUrl = node?.thumbnail_src || node?.display_url;
  return typeof imageUrl === "string" ? fetchPublicInstagramImage(imageUrl) : null;
}
