import type { Locale } from "@/lib/i18n";
import type { SurfFrequency, SurfLevel, WaveQuality } from "@/lib/ecommerce/volumeCalculator";

type OptionCopy<T extends string> = {
  value: T;
  title: string;
  description: string;
};

export type VolumeCalculatorCopy = {
  pageTitle: string;
  pageIntro: string;
  formulaTitle: string;
  formulaText: string;
  explainTitle: string;
  explainBullets: string[];
  tip: string;
  surferData: string;
  heightLabel: string;
  weightLabel: string;
  ageLabel: string;
  surfLevel: string;
  surfFrequency: string;
  waveType: string;
  recommendedVolume: string;
  noResult: string;
  seeBoards: string;
  menuLabel: string;
  menuHint: string;
  levels: OptionCopy<SurfLevel>[];
  frequencies: OptionCopy<SurfFrequency>[];
  waves: OptionCopy<WaveQuality>[];
};

const pt: VolumeCalculatorCopy = {
  pageTitle: "Calculadora de volume",
  pageIntro:
    "O volume é um dos factores mais importantes na escolha da prancha certa. Influencia a flutuação, a estabilidade e a facilidade com que apanhas ondas.",
  formulaTitle: "Como é calculado?",
  formulaText:
    "(PESO & EXPERIÊNCIA) × (IDADE) × (CONDIÇÃO FÍSICA) × (TIPO DE ONDA) = VOLUME IDEAL. Não é uma fórmula matemática exacta, mas uma estimativa prática para o teu perfil.",
  explainTitle: "O que isto significa?",
  explainBullets: [
    "Peso & experiência: se estás a começar, precisas de mais volume para estabilidade. Com experiência, podes reduzir volume e ganhar manobrabilidade.",
    "Idade: à medida que os anos passam, mais volume pode ajudar na remada e no equilíbrio.",
    "Condição física / frequência: se surfas pouco ou estás a voltar ao surf, mais volume é mais confortável. Se surfas com regularidade, podes usar menos volume.",
    "Tipo de onda: ondas más ou fracas pedem um pouco mais de volume para apanhar mais ondas.",
  ],
  tip: "Se tiveres dúvidas, fala connosco — ajudamos a encontrar a prancha ideal para o teu nível, estilo e objectivos no mar.",
  surferData: "Dados do surfista",
  heightLabel: "Altura (cm)",
  weightLabel: "Peso (kg)",
  ageLabel: "Idade",
  surfLevel: "Nível de surf",
  surfFrequency: "Frequência de surf",
  waveType: "Tipo de onda",
  recommendedVolume: "Volume recomendado",
  noResult: "—",
  seeBoards: "Ver pranchas recomendadas",
  menuLabel: "Calculadora de volume",
  menuHint: "Descobre o volume ideal para ti",
  levels: [
    { value: "initial", title: "Iniciante", description: "A aprender" },
    { value: "intermediate", title: "Intermédio", description: "Surf há alguns anos" },
    { value: "advanced", title: "Avançado", description: "Surfer orgulhoso" },
    { value: "professional", title: "Profissional", description: "Surfer profissional" },
  ],
  frequencies: [
    { value: "rare", title: "Raro", description: "3 a 4 vezes por ano" },
    { value: "occasional", title: "Ocasional", description: "1 a 2 vezes por mês" },
    { value: "active", title: "Activo", description: "1 a 2 vezes por semana" },
    { value: "addicted", title: "Viciado", description: "3 a 5 vezes por semana" },
  ],
  waves: [
    { value: "low", title: "Fraca", description: "Ondas más ou pequenas" },
    { value: "medium", title: "Média", description: "Condiciones normais" },
    { value: "high", title: "Forte", description: "Ondas potentes" },
  ],
};

const en: VolumeCalculatorCopy = {
  pageTitle: "Volume calculator",
  pageIntro:
    "Volume is one of the most important factors when choosing the right board. It affects buoyancy, stability, and how easily you catch waves.",
  formulaTitle: "How is it calculated?",
  formulaText:
    "(WEIGHT & EXPERIENCE) × (AGE) × (FITNESS) × (WAVE TYPE) = IDEAL VOLUME. This is not an exact formula, but a practical estimate for your profile.",
  explainTitle: "What does that mean?",
  explainBullets: [
    "Weight & experience: beginners need more volume for stability. With experience, you can go lower for maneuverability.",
    "Age: as the years go by, a bit more volume can help with paddling and balance.",
    "Fitness / frequency: if you surf rarely or are getting back into it, more volume is more comfortable. Regular surfers can use less.",
    "Wave type: weak or small waves call for a little extra volume to catch more waves.",
  ],
  tip: "If you are unsure, talk to us — we help you find the ideal board for your level, style, and goals in the water.",
  surferData: "Surfer data",
  heightLabel: "Height (cm)",
  weightLabel: "Weight (kg)",
  ageLabel: "Age",
  surfLevel: "Surf level",
  surfFrequency: "Surf frequency",
  waveType: "Wave type",
  recommendedVolume: "Recommended volume",
  noResult: "—",
  seeBoards: "See recommended boards",
  menuLabel: "Volume calculator",
  menuHint: "Find your ideal board volume",
  levels: [
    { value: "initial", title: "Beginner", description: "Learning" },
    { value: "intermediate", title: "Intermediate", description: "Surfing for a few years" },
    { value: "advanced", title: "Advanced", description: "Proud surfer" },
    { value: "professional", title: "Professional", description: "Pro surfer" },
  ],
  frequencies: [
    { value: "rare", title: "Rare", description: "3 to 4 times a year" },
    { value: "occasional", title: "Occasional", description: "1 to 2 times a month" },
    { value: "active", title: "Active", description: "1 to 2 times a week" },
    { value: "addicted", title: "Addicted", description: "3 to 5 times a week" },
  ],
  waves: [
    { value: "low", title: "Low", description: "Weak or small waves" },
    { value: "medium", title: "Medium", description: "Average conditions" },
    { value: "high", title: "High", description: "Powerful waves" },
  ],
};

const zh: VolumeCalculatorCopy = {
  pageTitle: "冲浪板体积计算器",
  pageIntro: "体积是选板最重要的因素之一，影响浮力、稳定性以及抓浪的难易程度。",
  formulaTitle: "如何计算？",
  formulaText:
    "（体重与经验）×（年龄）×（体能/频率）×（浪型）= 理想体积。这不是精确公式，而是针对你个人情况的实用估算。",
  explainTitle: "这意味着什么？",
  explainBullets: [
    "体重与经验：初学者需要更大体积以保持稳定；有经验后可减少体积以提高操控性。",
    "年龄：随着年龄增长，适当增加体积有助于划水和平衡。",
    "体能/频率：如果很少冲浪或刚回归，更大体积更舒适；经常冲浪可使用更小体积。",
    "浪型：弱浪或小浪通常需要稍大体积以便多抓浪。",
    ],
  tip: "如有疑问请联系我们，我们会根据你的水平、风格和目标帮你找到合适的板。",
  surferData: "冲浪者信息",
  heightLabel: "身高 (cm)",
  weightLabel: "体重 (kg)",
  ageLabel: "年龄",
  surfLevel: "冲浪水平",
  surfFrequency: "冲浪频率",
  waveType: "浪型",
  recommendedVolume: "推荐体积",
  noResult: "—",
  seeBoards: "查看推荐冲浪板",
  menuLabel: "体积计算器",
  menuHint: "找到适合你的板体积",
  levels: [
    { value: "initial", title: "初学者", description: "正在学习" },
    { value: "intermediate", title: "中级", description: "冲浪数年" },
    { value: "advanced", title: "高级", description: "资深冲浪者" },
    { value: "professional", title: "专业", description: "职业冲浪者" },
  ],
  frequencies: [
    { value: "rare", title: "很少", description: "每年 3–4 次" },
    { value: "occasional", title: "偶尔", description: "每月 1–2 次" },
    { value: "active", title: "活跃", description: "每周 1–2 次" },
    { value: "addicted", title: "狂热", description: "每周 3–5 次" },
  ],
  waves: [
    { value: "low", title: "弱浪", description: "小浪或条件差" },
    { value: "medium", title: "中等", description: "一般条件" },
    { value: "high", title: "强浪", description: "有力浪况" },
  ],
};

export function volumeCalculatorCopy(locale: Locale): VolumeCalculatorCopy {
  if (locale === "pt") return pt;
  if (locale === "zh") return zh;
  return en;
}
