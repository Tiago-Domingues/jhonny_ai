import { z } from "zod";
import { hasDatabaseUrl, prisma } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { readSessionUser } from "@/lib/ecommerce/session";

const availabilitySchema = z.object({
  productId: z.string().min(1),
  email: z.string().email(),
  name: z.string().max(120).optional().or(z.literal("")),
  phoneCountryCode: z.string().min(2).max(8).default("+351"),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();

  try {
    const data = availabilitySchema.parse(await readJson(request));
    const session = await readSessionUser();
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: data.productId }, { slug: data.productId }] },
    });
    if (!product) {
      return Response.json({ error: "product_not_found" }, { status: 404 });
    }

    const requestRow = await prisma.availabilityRequest.create({
      data: {
        productId: product.id,
        userId: session?.id || null,
        email: data.email,
        name: data.name || null,
        phone: data.phone ? `${data.phoneCountryCode} ${data.phone}` : null,
        message: data.message || null,
      },
    });

    return Response.json({ request: requestRow });
  } catch (error) {
    return apiError(error);
  }
}
