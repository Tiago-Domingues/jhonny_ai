import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import { OdooClient, hasOdooConfig } from "@/lib/ecommerce/odooClient";

function responseBody(body: Buffer) {
  return new Uint8Array(body);
}

function firstImageUrl(imageUrlsJson?: string | null) {
  if (!imageUrlsJson) return null;
  try {
    const parsed = JSON.parse(imageUrlsJson);
    return Array.isArray(parsed) && typeof parsed[0] === "string" ? parsed[0] : null;
  } catch {
    return null;
  }
}

async function imageFromOdoo(odooProductId: number) {
  if (!hasOdooConfig()) return null;

  const [product] = await new OdooClient().searchRead(
    "product.product",
    [["id", "=", odooProductId]],
    ["image_512"],
    { limit: 1 }
  );
  const image = product?.image_512;
  if (typeof image !== "string" || !image) return null;

  const encoded = image.startsWith("data:image/") ? image.split(",", 2)[1] : image;
  if (!encoded) return null;

  return Buffer.from(encoded, "base64");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ odooProductId: string }> }
) {
  const { odooProductId } = await context.params;
  const id = Number(odooProductId);
  if (!Number.isFinite(id)) return new Response(null, { status: 404 });

  const product = hasDatabaseUrl()
    ? await prisma.product.findFirst({
        where: { odooProductId: id },
        select: { imageUrlsJson: true },
      })
    : null;

  const firstImage = firstImageUrl(product?.imageUrlsJson);
  if (!firstImage || typeof firstImage !== "string" || !firstImage.startsWith("data:image/")) {
    const odooImage = await imageFromOdoo(id);
    if (!odooImage) return new Response(null, { status: 404 });

    return new Response(responseBody(odooImage), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      },
    });
  }

  const [meta, encoded] = firstImage.split(",", 2);
  if (!encoded) return new Response(null, { status: 404 });
  const contentType = meta.includes("png") ? "image/png" : "image/jpeg";
  return new Response(responseBody(Buffer.from(encoded, "base64")), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
    },
  });
}
