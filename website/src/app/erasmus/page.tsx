import type { Metadata } from "next";
import { InfoPage, type InfoContent } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Vantagens Erasmus",
  description:
    "Estudante Erasmus em Lisboa? Descobre as vantagens da Jhonny Surf Store para a tua temporada de surf.",
};

const pt: InfoContent = {
  title: "Vantagens Erasmus",
  intro:
    "Estás em Lisboa por uma temporada e queres surfar? A Jhonny Surf Store é a tua base em Carcavelos. Criámos condições especiais para quem está de passagem mas quer viver o surf a sério.",
  sections: [
    {
      heading: "O que oferecemos",
      bullets: [
        "Condições especiais em material essencial para a tua estadia.",
        "Aconselhamento gratuito para escolheres o equipamento certo.",
        "Aluguer e opções flexíveis para não teres de comprar tudo.",
        "Recompra de pranchas no fim da temporada (buy-back).",
      ],
    },
    {
      heading: "Como funciona",
      paragraphs: [
        "Passa pela loja com a tua identificação de estudante / comprovativo Erasmus e falamos das melhores opções para o teu tempo em Portugal.",
      ],
    },
    {
      heading: "Junta-te à comunidade",
      paragraphs: [
        "Mais do que uma loja, somos um ponto de encontro. Segue-nos no Instagram para saberes de sessões, eventos e novidades, e passa pelo The Dudes — Surf Café para um café antes da água.",
      ],
    },
  ],
};

const en: InfoContent = {
  title: "Erasmus Perks",
  intro:
    "In Lisbon for a season and want to surf? Jhonny Surf Store is your base in Carcavelos. We've put together special conditions for those passing through who still want to live surf for real.",
  sections: [
    {
      heading: "What we offer",
      bullets: [
        "Special conditions on essential gear for your stay.",
        "Free advice to choose the right equipment.",
        "Rental and flexible options so you don't have to buy everything.",
        "Board buy-back at the end of the season.",
      ],
    },
    {
      heading: "How it works",
      paragraphs: [
        "Drop by the store with your student ID / Erasmus proof and we'll talk through the best options for your time in Portugal.",
      ],
    },
    {
      heading: "Join the community",
      paragraphs: [
        "More than a shop, we're a meeting point. Follow us on Instagram for sessions, events and news, and stop by The Dudes — Surf Café for a coffee before the water.",
      ],
    },
  ],
};

const zh: InfoContent = {
  title: "Erasmus 优惠",
  intro:
    "在里斯本短期停留并想冲浪？Jhonny Surf Store 是你在 Carcavelos 的基地。我们为短期旅居、却想认真体验冲浪的人准备了特别优惠。",
  sections: [
    {
      heading: "我们提供什么",
      bullets: [
        "针对你停留期间的必备装备特别条件。",
        "免费专业建议，帮你选对装备。",
        "租赁与灵活方案，不必样样都买。",
        "学期结束时可回购冲浪板。",
      ],
    },
    {
      heading: "如何参与",
      paragraphs: [
        "带上学生证 / Erasmus 证明到店，我们会根据你在葡萄牙的时间给出最佳方案。",
      ],
    },
    {
      heading: "加入社区",
      paragraphs: [
        "我们不只是一家店，更是聚会点。关注 Instagram 了解浪讯、活动与新品，并在下水前来 The Dudes — 冲浪咖啡馆喝杯咖啡。",
      ],
    },
  ],
};

export default function Page() {
  return <InfoPage pt={pt} en={en} zh={zh} />;
}
