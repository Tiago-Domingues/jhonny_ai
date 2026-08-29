import type { Metadata } from "next";
import { InfoPage, type InfoContent } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Trocas e Devoluções",
  description:
    "Política de trocas e devoluções da Jhonny Surf Store, incluindo o direito de livre resolução.",
};

const pt: InfoContent = {
  title: "Trocas e Devoluções",
  updated: "Última atualização: 2026",
  intro:
    "Queremos que fiques 100% satisfeito com o teu material. Se algo não correr como esperavas, fala connosco — resolvemos sempre da forma mais simples possível.",
  sections: [
    {
      heading: "Trocas na loja",
      paragraphs: [
        "Podes trocar artigos novos, sem uso e com etiqueta, no prazo de 14 dias após a compra, mediante apresentação do comprovativo. Pranchas e fatos com sinais de uso não são elegíveis para troca.",
      ],
    },
    {
      heading: "Direito de livre resolução (compras à distância)",
      paragraphs: [
        "Nas compras realizadas à distância, dispões de 14 dias para resolver o contrato sem necessidade de justificação, nos termos da lei. O prazo conta a partir da receção do artigo.",
        "Para exercer este direito, contacta-nos pelos canais indicados. O artigo deve ser devolvido em estado novo, na embalagem original e com todos os acessórios.",
      ],
    },
    {
      heading: "Reembolsos",
      paragraphs: [
        "Após verificarmos o artigo devolvido, processamos o reembolso pelo mesmo meio de pagamento utilizado na compra, no prazo legal aplicável.",
      ],
    },
    {
      heading: "Exceções",
      bullets: [
        "Produtos personalizados ou feitos por encomenda.",
        "Artigos de higiene ou usados (por exemplo, fatos vestidos).",
        "Produtos danificados por uso indevido.",
      ],
    },
    {
      heading: "Artigos com defeito",
      paragraphs: [
        "Em caso de defeito de fabrico, aplica-se a garantia legal. Consulta a página de Garantia ou contacta-nos diretamente.",
      ],
    },
  ],
};

const en: InfoContent = {
  title: "Returns & Exchanges",
  updated: "Last updated: 2026",
  intro:
    "We want you to be 100% happy with your gear. If something isn't quite right, talk to us — we'll always sort it out as simply as possible.",
  sections: [
    {
      heading: "In-store exchanges",
      paragraphs: [
        "You can exchange new, unused items with tags within 14 days of purchase, upon presentation of proof of purchase. Boards and wetsuits showing signs of use are not eligible for exchange.",
      ],
    },
    {
      heading: "Right of withdrawal (distance sales)",
      paragraphs: [
        "For distance purchases, you have 14 days to withdraw from the contract without justification, as provided by law. The period starts from the date you receive the item.",
        "To exercise this right, contact us through the channels provided. The item must be returned in new condition, in its original packaging and with all accessories.",
      ],
    },
    {
      heading: "Refunds",
      paragraphs: [
        "After we inspect the returned item, we process the refund using the same payment method used for the purchase, within the applicable legal timeframe.",
      ],
    },
    {
      heading: "Exceptions",
      bullets: [
        "Personalised or made-to-order products.",
        "Hygiene or used items (for example, worn wetsuits).",
        "Products damaged by misuse.",
      ],
    },
    {
      heading: "Faulty items",
      paragraphs: [
        "In case of a manufacturing defect, the legal warranty applies. See the Warranty page or contact us directly.",
      ],
    },
  ],
};

const zh: InfoContent = {
  title: "退换货",
  updated: "最后更新：2026",
  intro:
    "我们希望你对装备 100% 满意。如果有任何不符预期之处，请与我们联系——我们会以最简单的方式帮你解决。",
  sections: [
    {
      heading: "门店换货",
      paragraphs: [
        "全新、未使用且带吊牌的商品，可在购买后 14 天内凭购买凭证到店换货。已有使用痕迹的冲浪板和潜水衣不可换货。",
      ],
    },
    {
      heading: "无条件解约权（远程购买）",
      paragraphs: [
        "远程购买时，你依法享有 14 天无需说明理由即可解除合同的权利。期限自收到商品之日起算。",
        "行使该权利时，请通过所示渠道联系我们。商品须保持全新状态，连同原包装及全部配件一并退回。",
      ],
    },
    {
      heading: "退款",
      paragraphs: [
        "在核验退回商品后，我们会通过购买时使用的同一支付方式办理退款，并在适用法定期限内完成。",
      ],
    },
    {
      heading: "例外",
      bullets: [
        "个性化或按订单定制的产品。",
        "卫生用品或已使用商品（例如已穿过的潜水衣）。",
        "因不当使用而损坏的产品。",
      ],
    },
    {
      heading: "有缺陷的商品",
      paragraphs: [
        "如存在制造缺陷，适用法定保修。请查阅保修页面或直接联系我们。",
      ],
    },
  ],
};

export default function Page() {
  return <InfoPage pt={pt} en={en} zh={zh} />;
}
