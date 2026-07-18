import type { CategoryGroupKey } from "@/lib/ecommerce/categoryGroups";

export type CategoryHero = {
  image: string;
  labelPt: string;
  labelEn: string;
  labelZh: string;
  subtitlePt: string;
  subtitleEn: string;
  subtitleZh: string;
};

const DEFAULT_HERO: CategoryHero = {
  image: "/brand/categories/hero-shop.png",
  labelPt: "Loja online",
  labelEn: "Online shop",
  labelZh: "网上商店",
  subtitlePt: "Escolhe a categoria e encontra o equipamento certo para a tua próxima sessão.",
  subtitleEn: "Pick a category and find the right gear for your next session.",
  subtitleZh: "选择分类，找到适合你下一场冲浪的装备。",
};

export const CATEGORY_HEROES: Record<CategoryGroupKey, CategoryHero> = {
  surfboards: {
    image: "/brand/categories/hero-surfboards.jpg",
    labelPt: "Pranchas",
    labelEn: "Surfboards",
    labelZh: "冲浪板",
    subtitlePt: "Performance, hybrid, soft top e longboard das melhores shapers.",
    subtitleEn: "Performance, hybrid, soft top and longboard from top shapers.",
    subtitleZh: "来自顶尖塑板师的竞速板、混合板、软板与长板。",
  },
  wetsuits: {
    image: "/brand/categories/hero-wetsuits.jpg",
    labelPt: "Fatos",
    labelEn: "Wetsuits",
    labelZh: "潜水衣",
    subtitlePt: "Neoprene técnico para todas as estações e condições do mar.",
    subtitleEn: "Technical neoprene for every season and sea condition.",
    subtitleZh: "适合各季节与海况的专业氯丁橡胶潜水衣。",
  },
  surfgear: {
    image: "/brand/categories/hero-surfgear.jpg",
    labelPt: "Material Técnico",
    labelEn: "Surf Gear",
    labelZh: "冲浪装备",
    subtitlePt: "Quilhas, leashes, decks, capas e acessórios para a água.",
    subtitleEn: "Fins, leashes, decks, boardbags and in-water accessories.",
    subtitleZh: "鱼鳍、脚绳、防滑垫、板袋与水上配件。",
  },
  essentials: {
    image: "/brand/categories/hero-essentials.jpg",
    labelPt: "Essenciais",
    labelEn: "Essentials",
    labelZh: "必备用品",
    subtitlePt: "Parafina, ponchos, beach gear e tudo o que precisas na praia.",
    subtitleEn: "Wax, ponchos, beach gear and everything you need at the beach.",
    subtitleZh: "冲浪蜡、浴袍斗篷、海滩用品以及你在沙滩需要的一切。",
  },
  bodyboard: {
    image: "/brand/categories/hero-bodyboard.jpg",
    labelPt: "Bodyboard",
    labelEn: "Bodyboard",
    labelZh: "趴板",
    subtitlePt: "Pranchas, pés de pato, leashes e acessórios de bodyboard.",
    subtitleEn: "Boards, swim fins, leashes and bodyboard accessories.",
    subtitleZh: "趴板、脚蹼、脚绳与趴板配件。",
  },
  lifestyle: {
    image: "/brand/categories/hero-lifestyle.png",
    labelPt: "Lifestyle",
    labelEn: "Lifestyle",
    labelZh: "生活方式",
    subtitlePt: "YETI, drinkware, livros e lifestyle da comunidade Jhonny.",
    subtitleEn: "YETI, drinkware, books and lifestyle from the Jhonny crew.",
    subtitleZh: "YETI、水杯、书籍与 Jhonny 社区生活方式单品。",
  },
};

export function getCategoryHero(categoryGroup?: string | null): CategoryHero {
  if (!categoryGroup) return DEFAULT_HERO;
  return CATEGORY_HEROES[categoryGroup as CategoryGroupKey] || DEFAULT_HERO;
}
