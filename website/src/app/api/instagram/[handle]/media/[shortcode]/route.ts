import { fetchPublicInstagramImage, fetchPublicInstagramMediaImage } from "@/lib/instagramPublic";

export const runtime = "nodejs";

function responseBody(body: ArrayBuffer | Buffer) {
  return body instanceof ArrayBuffer ? body : new Uint8Array(body);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string; shortcode: string }> }
) {
  const { handle, shortcode } = await context.params;
  const image =
    (await fetchPublicInstagramMediaImage(handle, shortcode)) ||
    (await fetchPublicInstagramImage(`https://www.instagram.com/p/${shortcode}/media/?size=l`));

  if (!image) {
    return Response.json({ error: "instagram_media_not_found" }, { status: 404 });
  }

  return new Response(responseBody(image.body), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
