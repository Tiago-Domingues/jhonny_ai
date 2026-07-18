export type Locale = "pt" | "en" | "zh";

export const LOCALES: Locale[] = ["en", "pt", "zh"];

export const LOCALE_META: Record<Locale, { label: string; short: string; htmlLang: string }> = {
  en: { label: "English", short: "EN", htmlLang: "en" },
  pt: { label: "Português", short: "PT", htmlLang: "pt" },
  zh: { label: "中文", short: "中文", htmlLang: "zh-CN" },
};

export const STORE = {
  name: "Jhonny Surf Store",
  phoneDisplay: "+351 935 968 825",
  phoneRaw: "351935968825",
  email: "jhonnysurfstore@gmail.com",
  address: "Rua de Gaza 16 loja direita, 2775-597 Carcavelos",
  region: "Carcavelos · Cascais · Lisboa",
  lat: 38.6828,
  lon: -9.3422,
  instagram: "https://www.instagram.com/jhonnysurfstore/",
  facebook: "https://www.facebook.com/jhonnysurfstore",
  mapsQuery: "Jhonny Surf Store, Rua de Gaza 16, 2775-597 Carcavelos",
};

export const WHATSAPP_DEFAULT_MESSAGE = "Hi Jhonny. Please help me becoming a legend.";

export function whatsappHref(message = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${STORE.phoneRaw}?text=${encodeURIComponent(message)}`;
}

export type Brand = { name: string; slug: string; domain: string };

export const BRANDS: Brand[] = [
  { name: "O'Neill", slug: "oneill", domain: "oneill.com" },
  { name: "YETI", slug: "yeti", domain: "yeti.com" },
  { name: "Roark", slug: "roark", domain: "roark.com" },
  { name: "Katin", slug: "katin", domain: "katin.com" },
  { name: "Volcom", slug: "volcom", domain: "volcom.com" },
  { name: "Billabong", slug: "billabong", domain: "billabong.com" },
  { name: "Xcel", slug: "xcel", domain: "xcelwetsuits.com" },
  { name: "Manera", slug: "manera", domain: "manera.com" },
  { name: "Futures Fins", slug: "futures", domain: "futuresfins.com" },
  { name: "Waveborn", slug: "waveborn", domain: "wavebornsunglasses.com" },
  { name: "Firewire", slug: "firewire", domain: "firewiresurfboards.com" },
  { name: "Sharp Eye", slug: "sharpeye", domain: "sharpeyesurfboards.com" },
  { name: "Al Merrick", slug: "almerrick", domain: "cisurfboards.com" },
  { name: "Lost", slug: "lost", domain: "lostsurfboards.com" },
];

// Legal entity behind the Jhonny Surf Store brand (used in legal pages).
export const LEGAL = {
  company: "Maori Surf Camp Unipessoal, Lda.",
  brand: "Jhonny Surf Store",
  nif: "516569783",
  address: "Rua Machado dos Santos n.º 514, Loja A.B, 2775-236 Parede",
};

export const NAV_LINKS = [
  { id: "surfboards", key: "surfboards" as const },
  { id: "wetsuits", key: "wetsuits" as const },
  { id: "surfgear", key: "surfgear" as const },
  { id: "essentials", key: "essentials" as const },
  { id: "bodyboard", key: "bodyboard" as const },
  { id: "lifestyle", key: "lifestyle" as const },
];

// Top-menu categories with their dropdown sub-items.
// `anchor` keeps the existing scroll behaviour for the category itself.
// Sub-item labels are resolved per-locale via `t.menuItems[<item>]`; brand
// names and surf jargon fall back to the raw id when no translation exists.
export type NavKey =
  | "surfboards"
  | "wetsuits"
  | "surfgear"
  | "essentials"
  | "bodyboard"
  | "lifestyle";

export const MENU_CATEGORIES: {
  key: NavKey;
  anchor: string;
  items: string[];
}[] = [
  {
    key: "surfboards",
    anchor: "surfboards",
    items: [
      "SURFBOARDS / PERFORMANCE",
      "SURFBOARDS / HYBRID",
      "SURFBOARDS / BEGINNER",
      "SURFBOARDS / MID LENGHT",
      "SURFBOARDS / SOFT TOP",
      "SURFBOARDS / TWIN FIN",
      "SURFBOARDS / LONGBOARD",
    ],
  },
  {
    key: "wetsuits",
    anchor: "wetsuits",
    // Fallback only — live menu is built from Odoo product.category paths.
    items: [
      "WETSUITS / MEN",
      "WETSUITS / WOMEN",
      "WETSUITS / JUNIOR",
      "WETSUITS / NEOPRENE ACESSORIES",
    ],
  },
  {
    key: "surfgear",
    anchor: "technical",
    items: [
      "SURFGEAR / FINS",
      "SURFGEAR / LEASHES",
      "SURFGEAR / DECKS",
      "SURFGEAR / BOARDBAGS",
      "SURFGEAR / RACK",
      "SURFGEAR / KEYVAULT",
    ],
  },
  {
    key: "essentials",
    anchor: "essentials",
    items: [
      "SURF ESSENCIALS / BEACH GEAR",
      "SURF ESSENCIALS / WAX",
      "SURF ESSENCIALS / DING REPAIRS",
      "SURF ESSENCIALS / EARPLUGS",
      "SURF ESSENCIALS / SURF PONCHOS",
    ],
  },
  {
    key: "bodyboard",
    anchor: "bodyboard",
    items: [
      "BODYBOARD / BOARDS",
      "BODYBOARD / FINS (PÉS DE PATO)",
      "BODYBOARD / LEASHES",
      "BODYBOARD / ACESSORIES",
    ],
  },
  {
    key: "lifestyle",
    anchor: "lifestyle",
    items: [
      "LIFESTYLE / YETI GEAR",
      "LIFESTYLE / DRINKWEAR & ACESSORIES",
      "LIFESTYLE / BOOKS",
    ],
  },
];

type Dict = {
  nav: {
    surfboards: string;
    wetsuits: string;
    surfgear: string;
    essentials: string;
    bodyboard: string;
    lifestyle: string;
    contact: string;
  };
  menuItems: Record<string, string>;
  hero: {
    eyebrow: string;
    title1: string;
    title2: string;
    subtitle: string;
    ctaVisit: string;
    ctaWhatsapp: string;
  };
  surf: {
    label: string;
    updated: string;
    loading: string;
    error: string;
    wave: string;
    period: string;
    wind: string;
  };
  shop: {
    eyebrow: string;
    title: string;
    subtitle: string;
    soon: string;
    explore: string;
    items: { id: string; title: string; desc: string }[];
  };
  jss: {
    eyebrow: string;
    title: string;
    p1: string;
    p2: string;
    stats: { value: string; label: string }[];
  };
  reviews: {
    title: string;
    summary: string;
    cta: string;
  };
  newsletter: {
    title: string;
    desc: string;
    placeholder: string;
    button: string;
    success: string;
  };
  travel: {
    eyebrow: string;
    title: string;
    desc: string;
    points: string[];
  };
  services: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: { title: string; desc: string }[];
    ask: string;
    askMsg: string;
    buyback: string;
    buybackMsg: string;
  };
  brands: { title: string };
  athletes: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  localHeroGroom: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  dudes: {
    eyebrow: string;
    title: string;
    desc: string;
    cta: string;
  };
  visit: {
    eyebrow: string;
    title: string;
    addressLabel: string;
    hoursLabel: string;
    hours: { days: string; time: string }[];
    directions: string;
    tourLabel: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    whatsapp: string;
    call: string;
    email: string;
    follow: string;
  };
  footer: {
    tagline: string;
    rights: string;
    madeWith: string;
    shopTitle: string;
    storeTitle: string;
    supportTitle: string;
    infoTitle: string;
    visit: string;
    services: string;
    repairs: string;
    buyback: string;
    erasmus: string;
    about: string;
    terms: string;
    privacy: string;
    returns: string;
    complaints: string;
    disputes: string;
    fraud: string;
    faq: string;
    warranty: string;
    payments: string;
  };
  whatsapp: {
    bubble: string;
  };
  account: {
    title: string;
    signIn: string;
    register: string;
    orders: string;
    soon: string;
    cartTitle: string;
    cartEmpty: string;
  };
};

export const translations: Record<Locale, Dict> = {
  pt: {
    nav: {
      surfboards: "Pranchas",
      wetsuits: "Fatos",
      surfgear: "Material Técnico",
      essentials: "Essenciais",
      bodyboard: "Bodyboard",
      lifestyle: "Lifestyle",
      contact: "Contacto",
    },
    menuItems: {
      Beginners: "Iniciados",
      "SURFBOARDS / PERFORMANCE": "Performance",
      "SURFBOARDS / HYBRID": "Hybrid",
      "SURFBOARDS / BEGINNER": "Iniciados",
      "SURFBOARDS / MID LENGHT": "Mid length",
      "SURFBOARDS / SOFT TOP": "Soft top",
      "SURFBOARDS / TWIN FIN": "Twin fin",
      "SURFBOARDS / LONGBOARD": "Longboard",
      "WETSUITS / MEN": "Homem",
      "WETSUITS / WOMEN": "Mulher",
      "WETSUITS / JUNIOR": "Júnior",
      "WETSUITS / NEOPRENE ACESSORIES": "Acessórios de neoprene",
      "SURFGEAR / FINS": "Quilhas",
      "SURFGEAR / LEASHES": "Leashes",
      "SURFGEAR / DECKS": "Decks",
      "SURFGEAR / BOARDBAGS": "Capas",
      "SURFGEAR / RACK": "Racks",
      "SURFGEAR / KEYVAULT": "Keyvault",
      "SURF ESSENCIALS / BEACH GEAR": "Praia",
      "SURF ESSENCIALS / WAX": "Parafina",
      "SURF ESSENCIALS / DING REPAIRS": "Reparação",
      "SURF ESSENCIALS / EARPLUGS": "Earplugs",
      "SURF ESSENCIALS / SURF PONCHOS": "Ponchos",
      "BODYBOARD / BOARDS": "Pranchas",
      "BODYBOARD / FINS": "Pés de pato",
      "BODYBOARD / FINS (PÉS DE PATO)": "Pés de pato",
      "BODYBOARD / LEASHES": "Leashes",
      "BODYBOARD / ACESSORIES": "Acessórios",
      "LIFESTYLE / YETI GEAR": "YETI",
      "LIFESTYLE / DRINKWEAR": "Drinkware",
      "LIFESTYLE / DRINKWEAR & ACESSORIES": "Drinkware",
      "LIFESTYLE / BOOKS": "Livros",
      Man: "Homem",
      Woman: "Mulher",
      Kids: "Criança",
      Clothing: "Roupa",
      "Beach Accessories": "Acessórios de Praia",
      Backpacks: "Mochilas",
      Boardbags: "Capas",
      Essentials: "Essenciais",
      Fins: "Quilhas",
    },
    hero: {
      eyebrow: "Surf, mar e estilo",
      title1: "Onde os surfistas",
      title2: "se tornam lendas",
      subtitle:
        "Equipamento escolhido para a água, a praia e a vida depois da sessão — com o aconselhamento honesto do Jhonny.",
      ctaVisit: "Visitar a loja",
      ctaWhatsapp: "WhatsApp",
    },
    surf: {
      label: "Condições ao vivo",
      updated: "atualizado",
      loading: "A obter as condições do mar…",
      error: "Condições indisponíveis de momento",
      wave: "onda",
      period: "período",
      wind: "vento",
    },
    shop: {
      eyebrow: "A loja",
      title: "Equipamento para cada onda",
      subtitle:
        "Das melhores marcas mundiais à nossa própria linha. Passa pela loja para experimentar e levar o melhor para a água.",
      soon: "Loja online em breve",
      explore: "Ver na loja",
      items: [
        { id: "surfboards", title: "Pranchas de Surf", desc: "Performance, hybrid, twin fin e longboard das melhores shapers." },
        { id: "wetsuits", title: "Fatos de Neoprene", desc: "Fatos técnicos para todas as estações e condições do mar." },
        { id: "surfgear", title: "Material Técnico", desc: "Quilhas, leashes, decks, capas e acessórios técnicos do Odoo." },
        { id: "essentials", title: "Essenciais", desc: "Parafina, ponchos, praia, earplugs e reparações." },
        { id: "bodyboard", title: "Bodyboard", desc: "Pranchas, pés de pato, leashes e acessórios de bodyboard." },
        { id: "lifestyle", title: "Lifestyle", desc: "YETI gear, drinkware, livros e lifestyle da loja." },
      ],
    },
    jss: {
      eyebrow: "JSS — a família",
      title: "Mais do que uma loja de surf",
      p1: "A Jhonny Surf Store é um ponto de encontro da comunidade de surf em Parede e Carcavelos. Aqui encontras tudo para a água — e uma equipa que te trata como parte da família, seja qual for o teu nível.",
      p2: "O Jhonny é conhecido pela honestidade e pelo conhecimento técnico acima da média. Aconselha-te sobre as ondas da zona, ajuda-te a escolher a prancha certa e prepara-te para a próxima sessão.",
      stats: [
        { value: "82+", label: "avaliações da comunidade" },
        { value: "5★", label: "referência local" },
        { value: "10–19h", label: "Segunda a Sábado" },
      ],
    },
    reviews: {
      title: "O que dizem na Google",
      summary: "5,0 ★ · 82+ avaliações da comunidade de surf",
      cta: "Ver avaliações na Google",
    },
    newsletter: {
      title: "Newsletter Jhonny",
      desc: "Recebe novidades, dicas e insights do mar uma vez por mês. Sem spam.",
      placeholder: "O teu email",
      button: "Subscrever",
      success: "Obrigado! Estás na lista.",
    },
    travel: {
      eyebrow: "Viagens",
      title: "Apanha ondas em qualquer lado",
      desc: "Planeia a tua próxima surf trip com quem conhece o mar. Equipamento, dicas e apoio para a tua aventura sobre as ondas.",
      points: [
        "Sacos de viagem e proteção de pranchas",
        "Aconselhamento de equipamento para cada destino",
        "Recompra da tua prancha quando vais embora",
      ],
    },
    services: {
      eyebrow: "Como te ajudamos",
      title: "Serviços feitos por surfistas",
      subtitle: "Não vendemos só equipamento — acompanhamos o teu surf do início ao fim.",
      items: [
        { title: "Aconselhamento especializado", desc: "Ajudamos-te a escolher a prancha e o fato certos para o teu nível e ondas." },
        { title: "Reparação de pranchas e fatos", desc: "Damos nova vida ao teu equipamento com reparações de confiança." },
        { title: "Recompra de pranchas", desc: "Vais-te embora de Portugal? Compramos a tua prancha de volta." },
        { title: "Aluguer", desc: "Aluguer de equipamento para apanhares ondas sem complicações." },
        { title: "Viagens de surf", desc: "Dicas e apoio para a tua próxima aventura sobre as ondas." },
        { title: "Vantagens Erasmus", desc: "Descontos e packs de boas-vindas para a comunidade estudante." },
      ],
      ask: "Falar com o Jhonny",
      askMsg: "Olá Jhonny! Preciso de aconselhamento sobre equipamento de surf.",
      buyback: "Vender a minha prancha",
      buybackMsg: "Olá Jhonny! Quero vender a minha prancha. Envio já fotos e contactos.",
    },
    brands: { title: "Marcas que trabalhamos" },
    athletes: {
      eyebrow: "A nossa equipa",
      title: "Local Hero's",
      subtitle:
        "O grupo de surfistas que representa a Jhonny Surf Store dentro e fora de água.",
    },
    localHeroGroom: {
      eyebrow: "Próxima geração",
      title: "Local Hero Groom",
      subtitle:
        "Jovens talentos locais em crescimento com a Jhonny Surf Store — placeholders até confirmarmos o roster oficial.",
    },
    dudes: {
      eyebrow: "Dentro da loja",
      title: "The Dudes — Surf Café",
      desc: "O nosso quiosque de café, snacks e bebidas mesmo dentro da loja. Passa por cá antes ou depois da sessão, recupera energia e fica a conviver com a comunidade.",
      cta: "Seguir no Instagram",
    },
    visit: {
      eyebrow: "Passa por cá",
      title: "Visita a loja",
      addressLabel: "Morada",
      hoursLabel: "Horário",
      hours: [
        { days: "Segunda a Sábado", time: "10:00 – 19:00" },
        { days: "Domingo", time: "Encerrado" },
      ],
      directions: "Como chegar",
      tourLabel: "Visita virtual à loja",
    },
    contact: {
      eyebrow: "Fala connosco",
      title: "Vamos apanhar ondas",
      subtitle:
        "Dúvidas sobre equipamento, reparações ou as ondas da zona? Estamos a uma mensagem de distância.",
      whatsapp: "Falar no WhatsApp",
      call: "Ligar",
      email: "Enviar email",
      follow: "Seguir no Instagram",
    },
    footer: {
      tagline: "Onde os surfistas se tornam lendas.",
      rights: "Todos os direitos reservados.",
      madeWith: "Carcavelos · Cascais · Lisboa",
      shopTitle: "Loja",
      storeTitle: "A Loja",
      supportTitle: "Apoio",
      infoTitle: "Informações",
      visit: "Visitar a loja",
      services: "Serviços",
      repairs: "Reparações",
      buyback: "Recompra de pranchas",
      erasmus: "Vantagens Erasmus",
      about: "Sobre nós",
      terms: "Termos e Condições",
      privacy: "Política de Privacidade",
      returns: "Trocas e Devoluções",
      complaints: "Livro de Reclamações",
      disputes: "Resolução de Conflitos",
      fraud: "Denunciar Fraude",
      faq: "FAQ",
      warranty: "Garantias e Reparações",
      payments: "Pagamentos seguros",
    },
    whatsapp: {
      bubble: "Hi Legend. How can I help you?",
    },
    account: {
      title: "A minha conta",
      signIn: "Entrar",
      register: "Criar conta",
      orders: "As minhas compras",
      soon: "Loja online em breve",
      cartTitle: "Carrinho",
      cartEmpty: "O teu carrinho está vazio.",
    },
  },
  en: {
    nav: {
      surfboards: "Surfboards",
      wetsuits: "Wetsuits",
      surfgear: "Surf Gear",
      essentials: "Essentials",
      bodyboard: "Bodyboard",
      lifestyle: "Lifestyle",
      contact: "Contact",
    },
    menuItems: {
      "SURFBOARDS / PERFORMANCE": "Performance",
      "SURFBOARDS / HYBRID": "Hybrid",
      "SURFBOARDS / BEGINNER": "Beginner",
      "SURFBOARDS / MID LENGHT": "Mid length",
      "SURFBOARDS / SOFT TOP": "Soft top",
      "SURFBOARDS / TWIN FIN": "Twin fin",
      "SURFBOARDS / LONGBOARD": "Longboard",
      "WETSUITS / MEN": "Men",
      "WETSUITS / WOMEN": "Women",
      "WETSUITS / JUNIOR": "Junior",
      "WETSUITS / NEOPRENE ACESSORIES": "Neoprene accessories",
      "SURFGEAR / FINS": "Fins",
      "SURFGEAR / LEASHES": "Leashes",
      "SURFGEAR / DECKS": "Decks",
      "SURFGEAR / BOARDBAGS": "Boardbags",
      "SURFGEAR / RACK": "Racks",
      "SURFGEAR / KEYVAULT": "Keyvault",
      "SURF ESSENCIALS / BEACH GEAR": "Beach gear",
      "SURF ESSENCIALS / WAX": "Wax",
      "SURF ESSENCIALS / DING REPAIRS": "Ding repairs",
      "SURF ESSENCIALS / EARPLUGS": "Earplugs",
      "SURF ESSENCIALS / SURF PONCHOS": "Ponchos",
      "BODYBOARD / BOARDS": "Boards",
      "BODYBOARD / FINS": "Fins",
      "BODYBOARD / FINS (PÉS DE PATO)": "Swim fins",
      "BODYBOARD / LEASHES": "Leashes",
      "BODYBOARD / ACESSORIES": "Accessories",
      "LIFESTYLE / YETI GEAR": "YETI",
      "LIFESTYLE / DRINKWEAR": "Drinkware",
      "LIFESTYLE / DRINKWEAR & ACESSORIES": "Drinkware",
      "LIFESTYLE / BOOKS": "Books",
    },
    hero: {
      eyebrow: "Surf, sea and style",
      title1: "Where surfers",
      title2: "become legends",
      subtitle:
        "Gear for the water, the beach and life after the session — with Jhonny's honest advice.",
      ctaVisit: "Visit the store",
      ctaWhatsapp: "WhatsApp",
    },
    surf: {
      label: "Live conditions",
      updated: "updated",
      loading: "Getting sea conditions…",
      error: "Conditions unavailable right now",
      wave: "wave",
      period: "period",
      wind: "wind",
    },
    shop: {
      eyebrow: "The store",
      title: "Gear for every wave",
      subtitle:
        "From the best brands in the world to our own line. Drop by the store to try it on and take the best to the water.",
      soon: "Online store coming soon",
      explore: "See in store",
      items: [
        { id: "surfboards", title: "Surfboards", desc: "Performance, hybrid, twin fin and longboard from the best shapers." },
        { id: "wetsuits", title: "Wetsuits", desc: "Technical wetsuits for every season and sea condition." },
        { id: "surfgear", title: "Surf Gear", desc: "Fins, leashes, decks, boardbags and technical Odoo categories." },
        { id: "essentials", title: "Essentials", desc: "Wax, ponchos, beach gear, earplugs and repairs." },
        { id: "bodyboard", title: "Bodyboard", desc: "Boards, swim fins, leashes and bodyboard accessories." },
        { id: "lifestyle", title: "Lifestyle", desc: "YETI gear, drinkware, books and store lifestyle products." },
      ],
    },
    jss: {
      eyebrow: "JSS — the family",
      title: "More than a surf store",
      p1: "Jhonny Surf Store is a meeting point for the surf community in Parede and Carcavelos. You'll find everything for the water — and a team that treats you like family, whatever your level.",
      p2: "Jhonny is known for his honesty and above-average technical knowledge. He'll advise you on the local waves, help you pick the right board and get you ready for your next session.",
      stats: [
        { value: "82+", label: "community reviews" },
        { value: "5★", label: "local legend" },
        { value: "10–19h", label: "Monday to Saturday" },
      ],
    },
    reviews: {
      title: "What people say on Google",
      summary: "5.0 ★ · 82+ reviews from the surf community",
      cta: "Read reviews on Google",
    },
    newsletter: {
      title: "Jhonny Newsletter",
      desc: "Get news, tips and sea insights once a month. No spam.",
      placeholder: "Your email",
      button: "Subscribe",
      success: "Thanks! You're on the list.",
    },
    travel: {
      eyebrow: "Travel",
      title: "Catch waves anywhere",
      desc: "Plan your next surf trip with people who know the ocean. Gear, tips and support for your adventure on the waves.",
      points: [
        "Travel bags and board protection",
        "Equipment advice for every destination",
        "Board buy-back when you leave",
      ],
    },
    services: {
      eyebrow: "How we help",
      title: "Services made by surfers",
      subtitle: "We don't just sell gear — we're with you through every step of your surf.",
      items: [
        { title: "Expert advice", desc: "We help you choose the right board and wetsuit for your level and waves." },
        { title: "Board & wetsuit repairs", desc: "We give your gear a new life with repairs you can trust." },
        { title: "Board buy-back", desc: "Leaving Portugal? We'll buy your board back from you." },
        { title: "Rentals", desc: "Equipment rental so you can catch waves hassle-free." },
        { title: "Surf travel", desc: "Tips and support for your next adventure on the waves." },
        { title: "Erasmus perks", desc: "Discounts and welcome packs for the student community." },
      ],
      ask: "Ask Jhonny",
      askMsg: "Hi Jhonny! I'd like some advice on surf gear.",
      buyback: "Sell my board",
      buybackMsg: "Hi Jhonny! I'd like to sell my board. I'll send photos and contacts now.",
    },
    brands: { title: "Brands we carry" },
    athletes: {
      eyebrow: "Our team",
      title: "Local Hero's",
      subtitle:
        "The crew of surfers representing Jhonny Surf Store in and out of the water.",
    },
    localHeroGroom: {
      eyebrow: "Next generation",
      title: "Local Hero Groom",
      subtitle:
        "Local young talent growing with Jhonny Surf Store — placeholder profiles until the official roster is confirmed.",
    },
    dudes: {
      eyebrow: "Inside the store",
      title: "The Dudes — Surf Café",
      desc: "Our coffee, snacks and drinks kiosk right inside the store. Drop by before or after your session, refuel and hang out with the community.",
      cta: "Follow on Instagram",
    },
    visit: {
      eyebrow: "Come by",
      title: "Visit the store",
      addressLabel: "Address",
      hoursLabel: "Opening hours",
      hours: [
        { days: "Monday to Saturday", time: "10:00 – 19:00" },
        { days: "Sunday", time: "Closed" },
      ],
      directions: "Get directions",
      tourLabel: "Virtual store tour",
    },
    contact: {
      eyebrow: "Get in touch",
      title: "Let's catch some waves",
      subtitle:
        "Questions about gear, repairs or the local waves? We're just one message away.",
      whatsapp: "Chat on WhatsApp",
      call: "Call us",
      email: "Send email",
      follow: "Follow on Instagram",
    },
    footer: {
      tagline: "Where surfers become legends.",
      rights: "All rights reserved.",
      madeWith: "Carcavelos · Cascais · Lisboa",
      shopTitle: "Shop",
      storeTitle: "The Store",
      supportTitle: "Support",
      infoTitle: "Information",
      visit: "Visit the store",
      services: "Services",
      repairs: "Repairs",
      buyback: "Board buy-back",
      erasmus: "Erasmus perks",
      about: "About us",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      returns: "Returns & Exchanges",
      complaints: "Complaints Book",
      disputes: "Dispute Resolution",
      fraud: "Report Fraud",
      faq: "FAQ",
      warranty: "Warranty & Repairs",
      payments: "Secure payments",
    },
    whatsapp: {
      bubble: "Hi Legend. How can I help you?",
    },
    account: {
      title: "My account",
      signIn: "Sign in",
      register: "Create account",
      orders: "My orders",
      soon: "Online store coming soon",
      cartTitle: "Cart",
      cartEmpty: "Your cart is empty.",
    },
  },
  zh: {
    nav: {
      surfboards: "冲浪板",
      wetsuits: "潜水衣",
      surfgear: "冲浪装备",
      essentials: "必备用品",
      bodyboard: "趴板",
      lifestyle: "生活方式",
      contact: "联系我们",
    },
    menuItems: {
      Beginners: "初学者",
      "SURFBOARDS / PERFORMANCE": "竞速板",
      "SURFBOARDS / HYBRID": "混合板",
      "SURFBOARDS / BEGINNER": "初学者",
      "SURFBOARDS / MID LENGHT": "中长板",
      "SURFBOARDS / SOFT TOP": "软板",
      "SURFBOARDS / TWIN FIN": "双鳍板",
      "SURFBOARDS / LONGBOARD": "长板",
      "WETSUITS / MEN": "男士",
      "WETSUITS / WOMEN": "女士",
      "WETSUITS / JUNIOR": "青少年",
      "WETSUITS / NEOPRENE ACESSORIES": "氯丁橡胶配件",
      "SURFGEAR / FINS": "鱼鳍",
      "SURFGEAR / LEASHES": "脚绳",
      "SURFGEAR / DECKS": "防滑垫",
      "SURFGEAR / BOARDBAGS": "板袋",
      "SURFGEAR / RACK": "车顶架",
      "SURFGEAR / KEYVAULT": "钥匙盒",
      "SURF ESSENCIALS / BEACH GEAR": "海滩用品",
      "SURF ESSENCIALS / WAX": "冲浪蜡",
      "SURF ESSENCIALS / DING REPAIRS": "修补",
      "SURF ESSENCIALS / EARPLUGS": "耳塞",
      "SURF ESSENCIALS / SURF PONCHOS": "浴袍斗篷",
      "BODYBOARD / BOARDS": "趴板",
      "BODYBOARD / FINS": "脚蹼",
      "BODYBOARD / FINS (PÉS DE PATO)": "脚蹼",
      "BODYBOARD / LEASHES": "脚绳",
      "BODYBOARD / ACESSORIES": "配件",
      "LIFESTYLE / YETI GEAR": "YETI",
      "LIFESTYLE / DRINKWEAR": "水杯装备",
      "LIFESTYLE / DRINKWEAR & ACESSORIES": "水杯装备",
      "LIFESTYLE / BOOKS": "书籍",
      Man: "男士",
      Woman: "女士",
      Kids: "儿童",
      Clothing: "服装",
      "Beach Accessories": "海滩配件",
      Backpacks: "背包",
      Boardbags: "板袋",
      Essentials: "必备用品",
      Fins: "鱼鳍",
    },
    hero: {
      eyebrow: "冲浪 · 大海 · 风格",
      title1: "冲浪者在此",
      title2: "成为传奇",
      subtitle: "为海上、海滩与下浪后的生活精选装备——还有 Jhonny 真诚专业的建议。",
      ctaVisit: "到店逛逛",
      ctaWhatsapp: "WhatsApp",
    },
    surf: {
      label: "实时浪况",
      updated: "更新于",
      loading: "正在获取海况…",
      error: "暂时无法获取海况",
      wave: "浪高",
      period: "周期",
      wind: "风力",
    },
    shop: {
      eyebrow: "商店",
      title: "每一浪都有合适装备",
      subtitle: "从全球顶尖品牌到我们的自有系列。欢迎到店试穿试用，把最好的装备带下水。",
      soon: "网上商店即将上线",
      explore: "进入商店",
      items: [
        { id: "surfboards", title: "冲浪板", desc: "来自顶尖塑板师的竞速板、混合板、双鳍板与长板。" },
        { id: "wetsuits", title: "潜水衣", desc: "适合各季节与海况的专业氯丁橡胶潜水衣。" },
        { id: "surfgear", title: "冲浪装备", desc: "鱼鳍、脚绳、防滑垫、板袋与专业配件。" },
        { id: "essentials", title: "必备用品", desc: "冲浪蜡、浴袍斗篷、海滩用品、耳塞与修补用品。" },
        { id: "bodyboard", title: "趴板", desc: "趴板、脚蹼、脚绳与趴板配件。" },
        { id: "lifestyle", title: "生活方式", desc: "YETI、水杯、书籍与门店生活方式单品。" },
      ],
    },
    jss: {
      eyebrow: "JSS — 大家庭",
      title: "不止是一家冲浪店",
      p1: "Jhonny Surf Store 是 Parede 与 Carcavelos 冲浪社区的聚会点。这里有你下水所需的一切——以及一支无论水平高低都把你当家人的团队。",
      p2: "Jhonny 以诚实与扎实的技术知识著称。他会告诉你本地浪点、帮你选对板，并助你准备好下一场冲浪。",
      stats: [
        { value: "82+", label: "社区评价" },
        { value: "5★", label: "本地口碑" },
        { value: "10–19h", label: "周一至周六" },
      ],
    },
    reviews: {
      title: "Google 上大家怎么说",
      summary: "5.0 ★ · 来自冲浪社区的 82+ 条评价",
      cta: "查看 Google 评价",
    },
    newsletter: {
      title: "Jhonny 通讯",
      desc: "每月一次资讯、技巧与海况分享。绝不滥发邮件。",
      placeholder: "你的邮箱",
      button: "订阅",
      success: "谢谢！你已加入名单。",
    },
    travel: {
      eyebrow: "旅行",
      title: "去任何地方追浪",
      desc: "与懂海的人一起规划下一次冲浪之旅。装备、建议与全程支持。",
      points: [
        "旅行袋与冲浪板保护",
        "针对每个目的地的装备建议",
        "离开时提供冲浪板回购",
      ],
    },
    services: {
      eyebrow: "我们如何帮助你",
      title: "冲浪者打造的服务",
      subtitle: "我们不只卖装备——陪你走过冲浪的每一步。",
      items: [
        { title: "专业建议", desc: "根据你的水平与浪况，帮你选择合适的冲浪板和潜水衣。" },
        { title: "冲浪板与潜水衣维修", desc: "可信赖的维修服务，让装备重获新生。" },
        { title: "冲浪板回购", desc: "要离开葡萄牙？我们可以回购你的冲浪板。" },
        { title: "租赁", desc: "装备租赁，让你轻松下水追浪。" },
        { title: "冲浪旅行", desc: "为你的下一次海上冒险提供建议与支持。" },
        { title: "Erasmus 优惠", desc: "面向学生社区的折扣与欢迎礼包。" },
      ],
      ask: "咨询 Jhonny",
      askMsg: "你好 Jhonny！我想咨询冲浪装备建议。",
      buyback: "出售我的冲浪板",
      buybackMsg: "你好 Jhonny！我想出售冲浪板，稍后发送照片和联系方式。",
    },
    brands: { title: "我们经营的品牌" },
    athletes: {
      eyebrow: "我们的团队",
      title: "Local Hero's",
      subtitle: "在水上水下代表 Jhonny Surf Store 的冲浪团队。",
    },
    localHeroGroom: {
      eyebrow: "下一代",
      title: "Local Hero Groom",
      subtitle: "与 Jhonny Surf Store 一起成长的本地年轻冲浪人才——名单确认前为占位展示。",
    },
    dudes: {
      eyebrow: "店内",
      title: "The Dudes — 冲浪咖啡馆",
      desc: "店内的咖啡、小吃与饮品小站。冲浪前后都可以来补充能量，和社区好友小聚。",
      cta: "关注 Instagram",
    },
    visit: {
      eyebrow: "欢迎到店",
      title: "来店逛逛",
      addressLabel: "地址",
      hoursLabel: "营业时间",
      hours: [
        { days: "周一至周六", time: "10:00 – 19:00" },
        { days: "周日", time: "休息" },
      ],
      directions: "获取路线",
      tourLabel: "虚拟店内导览",
    },
    contact: {
      eyebrow: "联系我们",
      title: "一起去追浪",
      subtitle: "关于装备、维修或本地浪况的问题？发条消息就好。",
      whatsapp: "WhatsApp 聊天",
      call: "致电我们",
      email: "发送邮件",
      follow: "关注 Instagram",
    },
    footer: {
      tagline: "冲浪者在此成为传奇。",
      rights: "版权所有。",
      madeWith: "Carcavelos · Cascais · Lisboa",
      shopTitle: "商店",
      storeTitle: "门店",
      supportTitle: "支持",
      infoTitle: "信息",
      visit: "到店逛逛",
      services: "服务",
      repairs: "维修",
      buyback: "冲浪板回购",
      erasmus: "Erasmus 优惠",
      about: "关于我们",
      terms: "条款与条件",
      privacy: "隐私政策",
      returns: "退换货",
      complaints: "投诉簿",
      disputes: "争议解决",
      fraud: "举报欺诈",
      faq: "常见问题",
      warranty: "保修与维修",
      payments: "安全支付",
    },
    whatsapp: {
      bubble: "嗨，传奇。我能帮你什么？",
    },
    account: {
      title: "我的账户",
      signIn: "登录",
      register: "创建账户",
      orders: "我的订单",
      soon: "网上商店即将上线",
      cartTitle: "购物车",
      cartEmpty: "购物车是空的。",
    },
  },
};
