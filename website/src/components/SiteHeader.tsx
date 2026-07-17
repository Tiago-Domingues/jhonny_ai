import { Header } from "@/components/Header";
import { listMenuCategories } from "@/lib/ecommerce/menuCategories";

export async function SiteHeader() {
  const categories = await listMenuCategories();
  return <Header categories={categories} />;
}
