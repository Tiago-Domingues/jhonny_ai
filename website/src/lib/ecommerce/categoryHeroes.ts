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
    image: "/brand/categories/hero-surfboards.jpg?v=20260827",
    labelPt: "Pranchas",
    labelEn: "Surfboards",
    labelZh: "冲浪板",
    subtitlePt: "Performance, hybrid, soft top e longboard das melhores shapers.",
    subtitleEn: "Performance, hybrid, soft top and longboard from top shapers.",
    subtitleZh: "来自顶尖塑板师的竞速板、混合板、软板与长板。",
  },
  wetsuits: {
    image: "/brand/categories/hero-wetsuits.jpg?v=20260827",
    labelPt: "Fatos",
    labelEn: "Wetsuits",
    labelZh: "潜水衣",
    subtitlePt: "Neoprene técnico para todas as estações e condições do mar.",
    subtitleEn: "Technical neoprene for every season and sea condition.",
    subtitleZh: "适合各季节与海况的专业氯丁橡胶潜水衣。",
  },
  surfgear: {
    image: "/brand/categories/hero-surfgear.jpg?v=20260827",
    labelPt: "Material Técnico",
    labelEn: "Surf Gear",
    labelZh: "冲浪装备",
    subtitlePt: "Quilhas, leashes, decks, capas e acessórios para a água.",
    subtitleEn: "Fins, leashes, decks, boardbags and in-water accessories.",
    subtitleZh: "鱼鳍、脚绳、防滑垫、板袋与水上配件。",
  },
  essentials: {
    image: "/brand/categories/hero-essentials.jpg?v=20260827",
    labelPt: "Surf Essencials",
    labelEn: "Surf Essencials",
    labelZh: "Surf Essencials",
    subtitlePt: "Parafina, ponchos, beach gear, lifestyle e tudo o que precisas na praia.",
    subtitleEn: "Wax, ponchos, beach gear, lifestyle and everything you need at the beach.",
    subtitleZh: "冲浪蜡、浴袍斗篷、海滩用品、生活方式以及你在沙滩需要的一切。",
  },
  bodyboard: {
    image: "/brand/categories/hero-bodyboard.jpg?v=20260827",
    labelPt: "Bodyboard",
    labelEn: "Bodyboard",
    labelZh: "趴板",
    subtitlePt: "Pranchas, pés de pato, leashes e acessórios de bodyboard.",
    subtitleEn: "Boards, swim fins, leashes and bodyboard accessories.",
    subtitleZh: "趴板、脚蹼、脚绳与趴板配件。",
  },
  clothing: {
    image: "/brand/categories/hero-lifestyle.jpg?v=20260827",
    labelPt: "Vestuário",
    labelEn: "Apparel",
    labelZh: "服装",
    subtitlePt: "Roupa, calçado, hats e acessórios.",
    subtitleEn: "Apparel, footwear, hats and accessories.",
    subtitleZh: "服装、鞋履、帽子与配件。",
  },
  jssMerch: {
    image: "/brand/categories/hero-jss-merch.jpg?v=20260827",
    labelPt: "JSS Merch",
    labelEn: "JSS Merch",
    labelZh: "JSS Merch",
    subtitlePt: "A linha própria da Jhonny Surf Store.",
    subtitleEn: "Jhonny Surf Store's own line.",
    subtitleZh: "Jhonny Surf Store 自有系列。",
  },
  travel: {
    image: "/brand/categories/hero-travel.jpg?v=20260827",
    labelPt: "Viagem",
    labelEn: "Travel",
    labelZh: "旅行",
    subtitlePt: "Mochilas, duffels, trolleys e everyday carry.",
    subtitleEn: "Backpacks, duffels, trolleys and everyday carry.",
    subtitleZh: "背包、旅行袋、拉杆箱与日常携带。",
  },
  surfskate: {
    image: "/brand/categories/hero-surfskate.jpg?v=20260827",
    labelPt: "Surfskate",
    labelEn: "Surfskate",
    labelZh: "陆地冲浪",
    subtitlePt: "Surfskates, proteção e acessórios.",
    subtitleEn: "Surfskates, protective gear and accessories.",
    subtitleZh: "陆地冲浪板、护具与配件。",
  },
};

export function getCategoryHero(categoryGroup?: string | null): CategoryHero {
  if (!categoryGroup) return DEFAULT_HERO;
  return CATEGORY_HEROES[categoryGroup as CategoryGroupKey] || DEFAULT_HERO;
}
