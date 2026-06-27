export type Locale = "pt" | "en";

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

export const NAV_LINKS = [
  { id: "surfboards", key: "surfboards" as const },
  { id: "wetsuits", key: "wetsuits" as const },
  { id: "technical", key: "technical" as const },
  { id: "apparel", key: "apparel" as const },
  { id: "jss", key: "jss" as const },
  { id: "travel", key: "travel" as const },
];

type Dict = {
  nav: {
    surfboards: string;
    wetsuits: string;
    technical: string;
    apparel: string;
    jss: string;
    travel: string;
    contact: string;
  };
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
    visit: string;
    services: string;
    repairs: string;
    buyback: string;
    erasmus: string;
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
      technical: "Material Técnico",
      apparel: "Vestuário",
      jss: "JSS",
      travel: "Viagens",
      contact: "Contacto",
    },
    hero: {
      eyebrow: "O teu spot para surf, surfskate e estilo",
      title1: "Onde os surfistas",
      title2: "se tornam lendas",
      subtitle:
        "Loja de surf em Carcavelos · Cascais. Pranchas, fatos, material técnico e vestuário — com o aconselhamento honesto do Jhonny para todos os níveis.",
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
        { id: "technical", title: "Material Técnico", desc: "Quilhas, leashes, decks, sacos, parafina e acessórios essenciais." },
        { id: "apparel", title: "Vestuário", desc: "Marcas de topo e a linha própria Jhonny Surf Store." },
        { id: "travel", title: "Viagens", desc: "Sacos, proteção e dicas para a tua próxima surf trip." },
        { id: "jss", title: "JSS", desc: "A linha própria da Jhonny Surf Store — feita por surfistas." },
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
      visit: "Visitar a loja",
      services: "Serviços",
      repairs: "Reparações",
      buyback: "Recompra de pranchas",
      erasmus: "Vantagens Erasmus",
    },
    whatsapp: {
      bubble: "Fala comigo!",
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
      technical: "Technical Gear",
      apparel: "Apparel",
      jss: "JSS",
      travel: "Travel",
      contact: "Contact",
    },
    hero: {
      eyebrow: "Your spot for surf, surfskate and style",
      title1: "Where surfers",
      title2: "become legends",
      subtitle:
        "Surf store in Carcavelos · Cascais. Boards, wetsuits, technical gear and apparel — with Jhonny's honest advice for every level.",
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
        { id: "technical", title: "Technical Gear", desc: "Fins, leashes, decks, bags, wax and the essentials." },
        { id: "apparel", title: "Apparel", desc: "Top brands and the in-house Jhonny Surf Store line." },
        { id: "travel", title: "Travel", desc: "Bags, protection and tips for your next surf trip." },
        { id: "jss", title: "JSS", desc: "The in-house Jhonny Surf Store line — made by surfers." },
      ],
    },
    jss: {
      eyebrow: "JSS — the family",
      title: "More than a surf shop",
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
      visit: "Visit the store",
      services: "Services",
      repairs: "Repairs",
      buyback: "Board buy-back",
      erasmus: "Erasmus perks",
    },
    whatsapp: {
      bubble: "Chat with us!",
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
};
