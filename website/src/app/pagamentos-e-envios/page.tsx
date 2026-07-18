import type { Metadata } from "next";
import { InfoPage, type InfoContent } from "@/components/InfoPage";

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
        "PayPal, quando a conta de comerciante estiver ligada.",
        "Klarna, quando o contrato/provider estiver confirmado.",
        "Cartão de débito/crédito (Visa, Mastercard).",
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
        "Portes grátis em encomendas acima de €50 (artigos volumosos como pranchas podem ter condições específicas — confirmamos sempre o custo contigo antes de avançar).",
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
        "PayPal once the merchant account is connected.",
        "Klarna once the contract/provider is confirmed.",
        "Debit/credit card (Visa, Mastercard).",
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
        "Free shipping on orders over €50 (bulky items such as boards may have specific conditions — we always confirm the cost with you before proceeding).",
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

export default function Page() {
  return <InfoPage pt={pt} en={en} />;
}
