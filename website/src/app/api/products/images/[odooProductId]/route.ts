import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";

function firstImageUrl(imageUrlsJson?: string | null) {
  if (!imageUrlsJson) return null;
  try {
    const parsed = JSON.parse(imageUrlsJson);
    return Array.isArray(parsed) && typeof parsed[0] === "string" ? parsed[0] : null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ odooProductId: string }> }
) {
  if (!hasDatabaseUrl()) return new Response(null, { status: 404 });

  const { odooProductId } = await context.params;
  const product = await prisma.product.findFirst({
    where: { odooProductId: Number(odooProductId) },
    select: { imageUrlsJson: true },
  });

  const firstImage = firstImageUrl(product?.imageUrlsJson);
  if (!firstImage || typeof firstImage !== "string" || !firstImage.startsWith("data:image/")) {
    return new Response(null, { status: 404 });
  }

  const [meta, encoded] = firstImage.split(",", 2);
  if (!encoded) return new Response(null, { status: 404 });
  const contentType = meta.includes("png") ? "image/png" : "image/jpeg";
  return new Response(Buffer.from(encoded, "base64"), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
    },
  });
}
