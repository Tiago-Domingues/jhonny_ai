import { listMenuCategories } from "@/lib/ecommerce/menuCategories";

export async function GET() {
  const categories = await listMenuCategories();
  return Response.json({ categories });
}
