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

function decodeOdooBinary(image: unknown): Buffer | null {
  if (typeof image !== "string" || !image) return null;
  const encoded = image.startsWith("data:image/") ? image.split(",", 2)[1] : image;
  if (!encoded) return null;
  try {
    return Buffer.from(encoded, "base64");
  } catch {
    return null;
  }
}

/**
 * Prefer true per-variant artwork:
 * 1) image_variant_512 (Odoo variant image)
 * 2) product.image rows linked to this product_variant_id (extra media)
 * 3) image_512 / image_128 (may be shared template image)
 */
async function imageFromOdoo(odooProductId: number) {
  if (!hasOdooConfig()) return null;
  const client = new OdooClient();

  const [product] = await client.searchRead(
    "product.product",
    [["id", "=", odooProductId]],
    ["image_variant_512", "image_variant_128", "image_512", "image_128"],
    { limit: 1 }
  );

  const variantBinary =
    decodeOdooBinary(product?.image_variant_512) || decodeOdooBinary(product?.image_variant_128);
  if (variantBinary) return variantBinary;

  try {
    const extras = await client.searchRead(
      "product.image",
      [["product_variant_id", "=", odooProductId]],
      ["image_512", "image_128", "image_1920"],
      { limit: 4, order: "id asc" }
    );
    for (const extra of extras) {
      const decoded =
        decodeOdooBinary(extra?.image_512) ||
        decodeOdooBinary(extra?.image_128) ||
        decodeOdooBinary(extra?.image_1920);
      if (decoded) return decoded;
    }
  } catch {
    // product.image may be unavailable on some Odoo setups
  }

  return decodeOdooBinary(product?.image_512) || decodeOdooBinary(product?.image_128);
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
        // Variant artwork can change in Odoo; avoid week-long stale color mixes.
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  }

  const [meta, encoded] = firstImage.split(",", 2);
  if (!encoded) return new Response(null, { status: 404 });
  const contentType = meta.includes("png") ? "image/png" : "image/jpeg";
  return new Response(responseBody(Buffer.from(encoded, "base64")), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
