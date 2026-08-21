/**
 * Refresh website/src/lib/ecommerce/surfboardReviewVideos.json from the three
 * review channels. Prefers YouTube Data API when YOUTUBE_API_KEY is set;
 * otherwise paginates public channel /videos pages (no request-time YouTube).
 *
 * Run: cd website && npm run sync:surfboard-videos
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src/lib/ecommerce/surfboardReviewVideos.json");

const CHANNELS = [
  {
    channel: "boardshopuk",
    handle: "BoardshopUK",
    channelId: "UCnDg0M0gmC9Lx599w36JeoA",
  },
  {
    channel: "surfnshow",
    handle: "surfnshowreviews7777",
    channelId: "UCyG8LQXPDH7WPuobykGStcQ",
  },
  {
    channel: "realwatersports",
    handle: "REALWatersports",
    channelId: "UCmBJWTsAhmcmITadPZjU__g",
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonAssignment(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) return null;
  const i = html.indexOf("{", start);
  if (i < 0) return null;
  let depth = 0;
  for (let j = i; j < html.length; j += 1) {
    const ch = html[j];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(i, j + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function collectVideos(node, into) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) collectVideos(child, into);
    return;
  }
  const lockup = node.lockupViewModel;
  if (lockup?.contentId && lockup?.metadata?.lockupMetadataViewModel?.title?.content) {
    into.push({
      videoId: String(lockup.contentId),
      title: String(lockup.metadata.lockupMetadataViewModel.title.content),
    });
  }
  const grid = node.gridVideoRenderer;
  if (grid?.videoId && (grid.title?.simpleText || grid.title?.runs)) {
    const title =
      grid.title.simpleText ||
      (Array.isArray(grid.title.runs) ? grid.title.runs.map((run) => run.text || "").join("") : "");
    if (title) into.push({ videoId: String(grid.videoId), title });
  }
  const rich = node.videoRenderer;
  if (rich?.videoId && (rich.title?.simpleText || rich.title?.runs)) {
    const title =
      rich.title.simpleText ||
      (Array.isArray(rich.title.runs) ? rich.title.runs.map((run) => run.text || "").join("") : "");
    if (title) into.push({ videoId: String(rich.videoId), title });
  }
  for (const value of Object.values(node)) collectVideos(value, into);
}

function findContinuation(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findContinuation(child);
      if (found) return found;
    }
    return null;
  }
  const token = node.continuationCommand?.token;
  if (typeof token === "string" && token.length > 20) return token;
  for (const value of Object.values(node)) {
    const found = findContinuation(value);
    if (found) return found;
  }
  return null;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${url} → HTTP ${response.status} ${body.slice(0, 200)}`);
  }
  return response.json();
}

async function fetchViaDataApi(apiKey, channelId) {
  const channel = await fetchJson(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`
  );
  const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return [];
  const videos = [];
  let pageToken = "";
  for (let page = 0; page < 100; page += 1) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", uploads);
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = await fetchJson(url);
    for (const item of data.items || []) {
      const videoId = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title;
      if (videoId && title) videos.push({ videoId, title });
    }
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }
  return videos;
}

async function fetchViaInnertube(handle) {
  const html = await fetchText(`https://www.youtube.com/@${handle}/videos`);
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];
  const initial = parseJsonAssignment(html, "ytInitialData = ");
  if (!initial) throw new Error(`No ytInitialData for @${handle}`);

  const collected = [];
  collectVideos(initial, collected);
  let token = findContinuation(initial);
  let pages = 0;

  while (token && apiKey && clientVersion && pages < 80) {
    await sleep(250);
    const data = await fetchJson(
      `https://www.youtube.com/youtubei/v1/browse?key=${encodeURIComponent(apiKey)}&prettyPrint=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://www.youtube.com",
          Referer: `https://www.youtube.com/@${handle}/videos`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "X-YouTube-Client-Name": "1",
          "X-YouTube-Client-Version": clientVersion,
        },
        body: JSON.stringify({
          context: { client: { clientName: "WEB", clientVersion, hl: "en" } },
          continuation: token,
        }),
      }
    );
    collectVideos(data, collected);
    token = findContinuation(data);
    pages += 1;
  }

  return collected;
}

async function fetchViaRss(channelId) {
  const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  const videos = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRe.exec(xml))) {
    const block = match[1];
    const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = block.match(/<title>([^<]+)<\/title>/)?.[1];
    if (videoId && title) videos.push({ videoId, title });
  }
  return videos;
}

function uniqueVideos(videos) {
  const seen = new Set();
  const out = [];
  for (const video of videos) {
    const videoId = String(video.videoId || "").trim();
    const title = String(video.title || "").trim();
    if (!videoId || !title || seen.has(videoId)) continue;
    seen.add(videoId);
    out.push({ videoId, title });
  }
  return out;
}

async function main() {
  const apiKey = String(process.env.YOUTUBE_API_KEY || "").trim();
  if (!apiKey) {
    console.log("YOUTUBE_API_KEY missing — using public channel pages (no Data API).");
  }

  const videos = [];
  for (const entry of CHANNELS) {
    let fetched = [];
    try {
      if (apiKey) {
        fetched = await fetchViaDataApi(apiKey, entry.channelId);
      } else {
        fetched = await fetchViaInnertube(entry.handle);
      }
    } catch (error) {
      console.warn(`Primary fetch failed for ${entry.handle}:`, error.message || error);
    }
    if (!fetched.length) {
      try {
        fetched = await fetchViaRss(entry.channelId);
        console.warn(`Fell back to RSS for ${entry.handle} (${fetched.length} recent videos).`);
      } catch (error) {
        console.warn(`RSS also failed for ${entry.handle}:`, error.message || error);
      }
    }
    const unique = uniqueVideos(fetched);
    console.log(`${entry.handle}: ${unique.length} videos`);
    for (const video of unique) {
      videos.push({ channel: entry.channel, videoId: video.videoId, title: video.title });
    }
  }

  videos.sort(
    (a, b) => a.channel.localeCompare(b.channel) || a.videoId.localeCompare(b.videoId)
  );

  const payload = {
    updatedAt: new Date().toISOString(),
    videos,
  };
  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${videos.length} videos to ${path.relative(ROOT, OUT)}`);
  if (!videos.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
