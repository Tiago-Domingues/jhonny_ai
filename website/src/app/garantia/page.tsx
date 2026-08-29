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

const zh: InfoContent = {
  title: "保修与维修",
  updated: "最后更新：2026",
  intro:
    "我们销售经久耐用的装备，并在购买后继续为你提供支持。以下说明保修以及我们的维修服务。",
  sections: [
    {
      heading: "法定符合性保修",
      paragraphs: [
        "商品享有葡萄牙法律规定的法定符合性保修。如存在制造缺陷，你有权依法要求维修、更换、减价或解除合同。",
      ],
    },
    {
      heading: "品牌保修",
      paragraphs: [
        "部分品牌为冲浪板、潜水衣和技术装备提供自有保修。在适用情况下，我们会协助你与制造商办理相关流程。",
      ],
    },
    {
      heading: "不在保修范围内",
      bullets: [
        "正常使用磨损。",
        "因事故、不当使用或长期暴露于阳光与高温造成的损坏。",
        "未经授权的第三方进行的维修或改动。",
      ],
    },
    {
      heading: "维修服务",
      paragraphs: [
        "我们与值得信赖的合作伙伴合作，维修冲浪板（凹陷、鱼鳍、加固）。把板带到店里，我们一起评估最合适的方案。",
      ],
    },
    {
      heading: "如何申请",
      paragraphs: [
        "请务必保留购买凭证，并通过所示渠道联系我们，说明问题并尽可能附上照片。",
      ],
    },
  ],
};

export default function Page() {
  return <InfoPage pt={pt} en={en} zh={zh} />;
}
