import type { Metadata } from "next";
import { InfoPage, type InfoContent } from "@/components/InfoPage";
import { FREE_SHIPPING_THRESHOLD_EUROS } from "@/lib/ecommerce/shipping";

export const metadata: Metadata = {
  title: "Pagamentos e Envios",
  description:
    "Métodos de pagamento aceites e informação sobre envios na Jhonny Surf Store.",
};

const pt: InfoContent = {
  title: "Pagamentos e Envios",
  updated: "Última atualização: 2026",
  intro:
    "Aqui encontras a informação sobre como pagar e como receber o teu material. O checkout online fica preparado para MB WAY, Multibanco, PayPal, Klarna, envio e levantamento em loja.",
  sections: [
    {
      heading: "Métodos de pagamento",
      bullets: [
        "MB WAY via Ifthenpay.",
        "Multibanco entidade/referência via Ifthenpay.",
        "Klarna, Google Pay, Apple Pay, Cartão, PayPal, Revolut Pay e Pix via Stripe.",
        "Payshop, quando o contrato Ifthenpay estiver ligado.",
        "Dinheiro na loja física.",
        "Transferência bancária para encomendas especiais.",
      ],
    },
    {
      heading: "Pagamentos seguros",
      paragraphs: [
        "Os pagamentos são processados através de fornecedores certificados. A Jhonny Surf Store não armazena dados completos de cartões.",
      ],
    },
    {
      heading: "Envios",
      paragraphs: [
        "Realizamos envios para Portugal Continental, Ilhas e Europa, sob consulta. O prazo de entrega depende do destino e da transportadora.",
        `Portes grátis em encomendas acima de €${FREE_SHIPPING_THRESHOLD_EUROS} (artigos volumosos como pranchas podem ter condições específicas — confirmamos sempre o custo contigo antes de avançar).`,
      ],
    },
    {
      heading: "Levantamento na loja",
      paragraphs: [
        "Podes pagar online e levantar a tua encomenda sem custos na nossa loja em Parede / Carcavelos, durante o horário de funcionamento. Aguarda sempre pelo email de confirmação antes de levantar.",
      ],
    },
  ],
};

const en: InfoContent = {
  title: "Payments & Shipping",
  updated: "Last updated: 2026",
  intro:
    "Here's how to pay and how to get your gear. The online checkout is prepared for MB WAY, Multibanco, PayPal, Klarna, shipping and in-store pickup.",
  sections: [
    {
      heading: "Payment methods",
      bullets: [
        "MB WAY through Ifthenpay.",
        "Multibanco entity/reference through Ifthenpay.",
        "Klarna, Google Pay, Apple Pay, card, PayPal, Revolut Pay and Pix through Stripe.",
        "Payshop once the Ifthenpay contract is connected.",
        "Cash in the physical store.",
        "Bank transfer for special orders.",
      ],
    },
    {
      heading: "Secure payments",
      paragraphs: [
        "Payments are processed through certified providers. Jhonny Surf Store does not store full card details.",
      ],
    },
    {
      heading: "Shipping",
      paragraphs: [
        "We ship to mainland Portugal, the islands and Europe, on request. Delivery time depends on the destination and carrier.",
        `Free shipping on orders over €${FREE_SHIPPING_THRESHOLD_EUROS} (bulky items such as boards may have specific conditions — we always confirm the cost with you before proceeding).`,
      ],
    },
    {
      heading: "Store pickup",
      paragraphs: [
        "You can pay online and pick up your order free of charge at our store in Parede / Carcavelos during opening hours. Always wait for the confirmation email before collecting.",
      ],
    },
  ],
};

const zh: InfoContent = {
  title: "支付与配送",
  updated: "最后更新：2026",
  intro:
    "这里说明如何付款以及如何收到装备。在线结账已准备支持 MB WAY、Multibanco、PayPal、Klarna、配送以及门店自取。",
  sections: [
    {
      heading: "支付方式",
      bullets: [
        "通过 Ifthenpay 使用 MB WAY。",
        "通过 Ifthenpay 使用 Multibanco 实体/参考码。",
        "通过 Stripe 使用 Klarna、Google Pay、Apple Pay、银行卡、PayPal、Revolut Pay 和 Pix。",
        "Payshop，待 Ifthenpay 合同接通后可用。",
        "实体店现金。",
        "特殊订单可通过银行转账。",
      ],
    },
    {
      heading: "安全支付",
      paragraphs: [
        "付款由经认证的供应商处理。Jhonny Surf Store 不会存储完整的银行卡信息。",
      ],
    },
    {
      heading: "配送",
      paragraphs: [
        "我们可向葡萄牙大陆、群岛及欧洲发货，需另行咨询。交货时间取决于目的地与承运商。",
        `订单满 €${FREE_SHIPPING_THRESHOLD_EUROS} 免运费（冲浪板等大件商品可能有特殊条件——我们会在继续处理前始终与你确认费用）。`,
      ],
    },
    {
      heading: "门店自取",
      paragraphs: [
        "你可以在线付款，并在营业时间内到我们位于 Parede / Carcavelos 的门店免费自取。请务必等待确认邮件后再前来取货。",
      ],
    },
  ],
};

export default function Page() {
  return <InfoPage pt={pt} en={en} zh={zh} />;
}
