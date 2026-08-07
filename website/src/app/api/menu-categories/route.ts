import { listMenuCategories } from "@/lib/ecommerce/menuCategories";

export const revalidate = 3600;

export async function GET() {
  const categories = await listMenuCategories();
  return Response.json(
    { categories },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Vercel-CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
