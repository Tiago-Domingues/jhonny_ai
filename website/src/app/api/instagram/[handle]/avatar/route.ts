import { fetchPublicInstagramAvatarUrl, fetchPublicInstagramImage } from "@/lib/instagramPublic";

export const runtime = "nodejs";

function responseBody(body: ArrayBuffer | Buffer) {
  return body instanceof ArrayBuffer ? body : new Uint8Array(body);
}

function envKey(handle: string, suffix: string) {
  return `INSTAGRAM_${handle.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${suffix}`;
}

function initials(handle: string) {
  return handle
    .replace(/^_+|_+$/g, "")
    .split(/[\W_]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "JSS";
}

function colorPair(handle: string) {
  const palettes = [
    ["#0f766e", "#67e8f9"],
    ["#0d3b66", "#f4d35e"],
    ["#164e63", "#fb923c"],
    ["#365314", "#bef264"],
    ["#3b0764", "#f0abfc"],
    ["#7f1d1d", "#fca5a5"],
  ];
  const index = [...handle].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

function fallbackSvg(handle: string, variant = "card") {
  const label = initials(handle);
  const [from, to] = colorPair(handle);
  if (variant === "chip") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${handle}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="48" fill="url(#g)"/>
  <circle cx="64" cy="28" r="18" fill="#ffffff" opacity="0.22"/>
  <path d="M16 74c8-19 20-29 32-29s24 10 32 29" fill="#071316" opacity="0.55"/>
  <text x="48" y="58" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="28" fill="#fff">${label}</text>
</svg>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 680" role="img" aria-label="${handle}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="0.55" stop-color="#1f8c9c"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="680" fill="url(#g)"/>
  <circle cx="256" cy="220" r="118" fill="#f7efe2" opacity="0.92"/>
  <path d="M96 602c24-130 104-205 160-205s136 75 160 205" fill="#111820" opacity="0.9"/>
  <text x="256" y="250" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="86" fill="#102f3c">${label}</text>
  <text x="256" y="640" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" letter-spacing="5" fill="#fff">JHONNY TEAM</text>
</svg>`;
}

async function fetchGraphAvatar(handle: string) {
  const accountId = process.env[envKey(handle, "ACCOUNT_ID")];
  const accessToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
  if (!accountId || !accessToken) return null;

  const url = new URL(`https://graph.facebook.com/v20.0/${accountId}`);
  url.searchParams.set("fields", "profile_picture_url");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) return null;
  const data = await response.json();
  return typeof data.profile_picture_url === "string" ? data.profile_picture_url : null;
}

async function fetchBusinessDiscoveryAvatar(handle: string) {
  const sourceAccountId =
    process.env.INSTAGRAM_GRAPH_SOURCE_ACCOUNT_ID ||
    process.env.INSTAGRAM_GRAPH_BUSINESS_DISCOVERY_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
  if (!sourceAccountId || !accessToken) return null;

  const username = handle.replace(/^@/, "");
  const url = new URL(`https://graph.facebook.com/v20.0/${sourceAccountId}`);
  url.searchParams.set("fields", `business_discovery.username(${username}){profile_picture_url}`);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) return null;
  const data = await response.json();
  const avatarUrl = data?.business_discovery?.profile_picture_url;
  return typeof avatarUrl === "string" ? avatarUrl : null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle } = await context.params;
  const avatarUrl =
    process.env[envKey(handle, "AVATAR_URL")] ||
    (await fetchGraphAvatar(handle)) ||
    (await fetchBusinessDiscoveryAvatar(handle)) ||
    (await fetchPublicInstagramAvatarUrl(handle));

  if (avatarUrl) {
    const image = await fetchPublicInstagramImage(avatarUrl);
    if (image) {
      return new Response(responseBody(image.body), {
        headers: {
          "Content-Type": image.contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  const variant = new URL(request.url).searchParams.get("variant") || "card";
  return new Response(fallbackSvg(handle, variant), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
