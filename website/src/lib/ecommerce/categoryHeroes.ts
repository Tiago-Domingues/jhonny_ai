import type { CategoryGroupKey } from "@/lib/ecommerce/categoryGroups";

export type CategoryHero = {
  image: string;
  labelPt: string;
  labelEn: string;
  subtitlePt: string;
  subtitleEn: string;
};

const DEFAULT_HERO: CategoryHero = {
  image: "/brand/categories/hero-shop.png",
  labelPt: "Loja online",
  labelEn: "Online shop",
  subtitlePt: "Escolhe a categoria e encontra o equipamento certo para a tua próxima sessão.",
  subtitleEn: "Pick a category and find the right gear for your next session.",
};

export const CATEGORY_HEROES: Record<CategoryGroupKey, CategoryHero> = {
  surfboards: {
    image: "/brand/categories/hero-surfboards.jpg",
    labelPt: "Pranchas",
    labelEn: "Surfboards",
    subtitlePt: "Performance, hybrid, soft top e longboard das melhores shapers.",
    subtitleEn: "Performance, hybrid, soft top and longboard from top shapers.",
  },
  wetsuits: {
    image: "/brand/categories/hero-wetsuits.jpg",
    labelPt: "Fatos",
    labelEn: "Wetsuits",
    subtitlePt: "Neoprene técnico para todas as estações e condições do mar.",
    subtitleEn: "Technical neoprene for every season and sea condition.",
  },
  surfgear: {
    image: "/brand/categories/hero-surfgear.jpg",
    labelPt: "Material Técnico",
    labelEn: "Surf Gear",
    subtitlePt: "Quilhas, leashes, decks, capas e acessórios para a água.",
    subtitleEn: "Fins, leashes, decks, boardbags and in-water accessories.",
  },
  essentials: {
    image: "/brand/categories/hero-essentials.jpg",
    labelPt: "Essenciais",
    labelEn: "Essentials",
    subtitlePt: "Parafina, ponchos, beach gear e tudo o que precisas na praia.",
    subtitleEn: "Wax, ponchos, beach gear and everything you need at the beach.",
  },
  bodyboard: {
    image: "/brand/categories/hero-bodyboard.jpg",
    labelPt: "Bodyboard",
    labelEn: "Bodyboard",
    subtitlePt: "Pranchas, pés de pato, leashes e acessórios de bodyboard.",
    subtitleEn: "Boards, swim fins, leashes and bodyboard accessories.",
  },
  lifestyle: {
    image: "/brand/categories/hero-lifestyle.png",
    labelPt: "Lifestyle",
    labelEn: "Lifestyle",
    subtitlePt: "YETI, drinkware, livros e lifestyle da comunidade Jhonny.",
    subtitleEn: "YETI, drinkware, books and lifestyle from the Jhonny crew.",
  },
};

export function getCategoryHero(categoryGroup?: string | null): CategoryHero {
  if (!categoryGroup) return DEFAULT_HERO;
  return CATEGORY_HEROES[categoryGroup as CategoryGroupKey] || DEFAULT_HERO;
}
