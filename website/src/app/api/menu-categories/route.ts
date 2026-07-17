import { listMenuCategories } from "@/lib/ecommerce/menuCategories";

export async function GET() {
  const categories = await listMenuCategories();
  return Response.json(
    { categories },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    }
  );
}
