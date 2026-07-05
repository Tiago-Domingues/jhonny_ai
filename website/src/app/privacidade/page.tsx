import type { Metadata } from "next";
import { InfoPage, type InfoContent } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a Jhonny Surf Store recolhe, utiliza e protege os teus dados pessoais.",
};

const pt: InfoContent = {
  title: "Política de Privacidade",
  updated: "Última atualização: 2026",
  intro:
    "A tua privacidade é importante para nós. Esta política explica que dados recolhemos, para que os usamos e quais os teus direitos, em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).",
  sections: [
    {
      heading: "Responsável pelo tratamento",
      paragraphs: [
        "Maori Surf Camp Unipessoal, Lda. (Jhonny Surf Store), NIF 516569783, com sede na Rua Machado dos Santos n.º 514, Loja A.B, 2775-236 Parede.",
      ],
    },
    {
      heading: "Que dados recolhemos",
      bullets: [
        "Dados de contacto que partilhas connosco (nome, telefone, email) quando nos contactas ou fazes uma encomenda.",
        "Dados de conta e perfil quando te registas, incluindo username, morada, idade/data de nascimento, género, tipo de cliente e preferências.",
        "Dados de carrinho, encomenda, pagamento e levantamento/envio.",
        "Dados de comunicação através de WhatsApp, Instagram ou email.",
        "Dados de cookies e navegação, conforme as escolhas que fazes no banner de consentimento.",
      ],
    },
    {
      heading: "Para que usamos os dados",
      bullets: [
        "Responder a pedidos de informação e gerir encomendas.",
        "Gerir conta de cliente, carrinho, checkout, pagamentos, emails de encomenda e pedidos de avaliação.",
        "Enviar lembretes de carrinho ou visita sem compra apenas quando existe consentimento de marketing válido.",
        "Prestar apoio pós-venda, garantias e reparações.",
        "Cumprir obrigações legais e fiscais.",
      ],
    },
    {
      heading: "Partilha de dados",
      paragraphs: [
        "Não vendemos os teus dados. Apenas os partilhamos com parceiros estritamente necessários à prestação do serviço, incluindo transporte, pagamentos (por exemplo Ifthenpay, PayPal ou Klarna quando ativados), email transacional e ferramentas legais/fiscais quando exigido por lei.",
        "Na próxima fase, alguns dados de cliente, produto, stock e encomenda poderão ser sincronizados com a conta Odoo do Jhonny para gestão operacional.",
      ],
    },
    {
      heading: "Prazo de conservação",
      paragraphs: [
        "Conservamos os dados apenas durante o tempo necessário às finalidades indicadas e aos prazos legais aplicáveis.",
      ],
    },
    {
      heading: "Os teus direitos",
      paragraphs: [
        "Podes solicitar o acesso, retificação, eliminação ou portabilidade dos teus dados, bem como opor-te ao tratamento, contactando-nos pelos canais indicados. Tens ainda o direito de apresentar reclamação à CNPD.",
      ],
    },
  ],
};

const en: InfoContent = {
  title: "Privacy Policy",
  updated: "Last updated: 2026",
  intro:
    "Your privacy matters to us. This policy explains what data we collect, what we use it for and your rights, in line with the General Data Protection Regulation (GDPR).",
  sections: [
    {
      heading: "Data controller",
      paragraphs: [
        "Maori Surf Camp Unipessoal, Lda. (Jhonny Surf Store), tax number 516569783, registered at Rua Machado dos Santos n.º 514, Loja A.B, 2775-236 Parede, Portugal.",
      ],
    },
    {
      heading: "What we collect",
      bullets: [
        "Contact details you share with us (name, phone, email) when you reach out or place an order.",
        "Account and profile details when you register, including username, address, age/date of birth, gender, customer type and preferences.",
        "Cart, order, payment, pickup and shipping data.",
        "Communication data via WhatsApp, Instagram or email.",
        "Cookie and browsing data according to your choices in the consent banner.",
      ],
    },
    {
      heading: "How we use it",
      bullets: [
        "Respond to enquiries and manage orders.",
        "Manage customer accounts, carts, checkout, payments, order emails and review requests.",
        "Send cart reminders or no-purchase reminders only when valid marketing consent exists.",
        "Provide after-sales support, warranty and repairs.",
        "Comply with legal and tax obligations.",
      ],
    },
    {
      heading: "Data sharing",
      paragraphs: [
        "We do not sell your data. We only share it with partners strictly necessary to deliver the service, including shipping, payments (for example Ifthenpay, PayPal or Klarna when enabled), transactional email and legal/tax tools when required by law.",
        "In the next phase, selected customer, product, stock and order data may be synchronized with Jhonny's Odoo account for operations management.",
      ],
    },
    {
      heading: "Retention",
      paragraphs: [
        "We keep data only for as long as necessary for the stated purposes and applicable legal periods.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You can request access, correction, deletion or portability of your data, as well as object to its processing, by contacting us through the channels provided. You also have the right to lodge a complaint with the Portuguese data protection authority (CNPD).",
      ],
    },
  ],
};

export default function Page() {
  return <InfoPage pt={pt} en={en} />;
}
