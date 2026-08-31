import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import { OdooClient, hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { MAX_PRODUCT_IMAGES, parseImageIndex } from "@/lib/ecommerce/odooProductImages";

function responseBody(body: Buffer) {
  return new Uint8Array(body);
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

function many2oneId(value: unknown) {
  if (Array.isArray(value)) return Number(value[0]);
  return Number(value);
}

async function imagesFromOdoo(odooProductId: number) {
  if (!hasOdooConfig()) return [];
  const client = new OdooClient();
  const [product] = await client.searchRead(
    "product.product",
    [["id", "=", odooProductId]],
    ["image_variant_512", "image_variant_128", "image_512", "image_128", "product_tmpl_id"],
    { limit: 1 }
  );
  if (!product) return [];

  const slots: Buffer[] = [];
  const variantBinary =
    decodeOdooBinary(product.image_variant_512) || decodeOdooBinary(product.image_variant_128);
  if (variantBinary) slots.push(variantBinary);

  try {
    const extras = await client.searchRead(
      "product.image",
      [["product_variant_id", "=", odooProductId]],
      ["image_512", "image_128"],
      { limit: MAX_PRODUCT_IMAGES, order: "id asc" }
    );
    for (const extra of extras) {
      const decoded = decodeOdooBinary(extra?.image_512) || decodeOdooBinary(extra?.image_128);
      if (decoded) slots.push(decoded);
    }
  } catch {
    // product.image may be unavailable on some Odoo setups
  }

  const templateId = many2oneId(product.product_tmpl_id);
  if (Number.isFinite(templateId) && templateId > 0) {
    try {
      const extras = await client.searchRead(
        "product.image",
        [
          ["product_tmpl_id", "=", templateId],
          ["product_variant_id", "=", false],
        ],
        ["image_512", "image_128"],
        { limit: MAX_PRODUCT_IMAGES, order: "id asc" }
      );
      for (const extra of extras) {
        const decoded = decodeOdooBinary(extra?.image_512) || decodeOdooBinary(extra?.image_128);
        if (decoded) slots.push(decoded);
      }
    } catch {
      // template extras optional
    }
  }

  if (!variantBinary) {
    const shared = decodeOdooBinary(product.image_512) || decodeOdooBinary(product.image_128);
    if (shared) slots.unshift(shared);
  }

  return slots.slice(0, MAX_PRODUCT_IMAGES);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ odooProductId: string }> }
) {
  const { odooProductId } = await context.params;
  const id = Number(odooProductId);
  if (!Number.isFinite(id)) return new Response(null, { status: 404 });
  const url = new URL(request.url);
  if (url.searchParams.get("list") === "1") {
    if (hasDatabaseUrl()) {
      const product = await prisma.product.findFirst({
        where: { odooProductId: id },
        select: { imageUrlsJson: true },
      });
      try {
        const parsed = product?.imageUrlsJson ? JSON.parse(product.imageUrlsJson) : null;
        const urls = Array.isArray(parsed)
          ? parsed.filter((value: unknown): value is string => typeof value === "string" && Boolean(value))
          : [];
        if (urls.length) {
          return Response.json(
            { count: urls.length, urls },
            { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
          );
        }
      } catch {
        // Fall through to the single primary slot.
      }
    }
    return Response.json(
      { count: 1, urls: [`/api/products/images/${id}`] },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
    );
  }
  const index = parseImageIndex(url.searchParams.get("i"));

  if (index === 0 && hasDatabaseUrl()) {
    const product = await prisma.product.findFirst({
      where: { odooProductId: id },
      select: { imageUrlsJson: true },
    });
    const first = (() => {
      try {
        const parsed = product?.imageUrlsJson ? JSON.parse(product.imageUrlsJson) : null;
        return Array.isArray(parsed) && typeof parsed[0] === "string" ? parsed[0] : null;
      } catch {
        return null;
      }
    })();
    if (first?.startsWith("data:image/")) {
      const [meta, encoded] = first.split(",", 2);
      if (encoded) {
        return new Response(responseBody(Buffer.from(encoded, "base64")), {
          headers: {
            "Content-Type": meta.includes("png") ? "image/png" : "image/jpeg",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        });
      }
    }
  }

  const odooImages = await imagesFromOdoo(id);
  const odooImage = odooImages[index] || odooImages[0];
  if (!odooImage) return new Response(null, { status: 404 });

  return new Response(responseBody(odooImage), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
