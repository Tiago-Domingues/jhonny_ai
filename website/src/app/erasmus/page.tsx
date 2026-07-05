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

export default function Page() {
  return <InfoPage pt={pt} en={en} />;
}
