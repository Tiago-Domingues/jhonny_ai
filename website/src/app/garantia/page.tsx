import type { Metadata } from "next";
import { InfoPage, type InfoContent } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Garantias e Reparações",
  description:
    "Garantia legal, garantias de marca e serviço de reparações na Jhonny Surf Store.",
};

const pt: InfoContent = {
  title: "Garantias e Reparações",
  updated: "Última atualização: 2026",
  intro:
    "Vendemos material para durar e damos-te apoio depois da compra. Aqui explicamos as garantias e o nosso serviço de reparações.",
  sections: [
    {
      heading: "Garantia legal de conformidade",
      paragraphs: [
        "Os bens beneficiam da garantia legal de conformidade prevista na lei portuguesa. Em caso de defeito de fabrico, tens direito à reparação, substituição, redução do preço ou resolução do contrato, nos termos legais.",
      ],
    },
    {
      heading: "Garantias de marca",
      paragraphs: [
        "Algumas marcas oferecem garantias próprias para pranchas, fatos e equipamento técnico. Ajudamos-te a tratar do processo junto do fabricante sempre que aplicável.",
      ],
    },
    {
      heading: "O que não está coberto",
      bullets: [
        "Desgaste normal de utilização.",
        "Danos por acidente, uso indevido ou exposição prolongada ao sol e calor.",
        "Reparações ou alterações feitas por terceiros não autorizados.",
      ],
    },
    {
      heading: "Serviço de reparações",
      paragraphs: [
        "Trabalhamos com parceiros de confiança para reparação de pranchas (dings, quilhas, reforços). Traz a tua prancha à loja e avaliamos o melhor caminho contigo.",
      ],
    },
    {
      heading: "Como acionar",
      paragraphs: [
        "Guarda sempre o comprovativo de compra e contacta-nos pelos canais indicados, descrevendo o problema e juntando fotografias quando possível.",
      ],
    },
  ],
};

const en: InfoContent = {
  title: "Warranty & Repairs",
  updated: "Last updated: 2026",
  intro:
    "We sell gear built to last and we support you after the purchase. Here's how warranties and our repair service work.",
  sections: [
    {
      heading: "Legal warranty of conformity",
      paragraphs: [
        "Goods benefit from the legal warranty of conformity under Portuguese law. In case of a manufacturing defect, you are entitled to repair, replacement, price reduction or contract termination, as provided by law.",
      ],
    },
    {
      heading: "Brand warranties",
      paragraphs: [
        "Some brands offer their own warranties for boards, wetsuits and technical equipment. We help you handle the process with the manufacturer whenever applicable.",
      ],
    },
    {
      heading: "What is not covered",
      bullets: [
        "Normal wear and tear.",
        "Damage from accidents, misuse or prolonged exposure to sun and heat.",
        "Repairs or alterations made by unauthorised third parties.",
      ],
    },
    {
      heading: "Repair service",
      paragraphs: [
        "We work with trusted partners for board repairs (dings, fins, reinforcements). Bring your board to the store and we'll assess the best path with you.",
      ],
    },
    {
      heading: "How to claim",
      paragraphs: [
        "Always keep your proof of purchase and contact us through the channels provided, describing the issue and attaching photos where possible.",
      ],
    },
  ],
};

export default function Page() {
  return <InfoPage pt={pt} en={en} />;
}
