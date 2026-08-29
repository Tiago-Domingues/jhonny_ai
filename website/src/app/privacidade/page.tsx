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

const zh: InfoContent = {
  title: "隐私政策",
  updated: "最后更新：2026",
  intro:
    "你的隐私对我们很重要。本政策说明我们收集哪些数据、如何使用这些数据以及你享有哪些权利，符合《通用数据保护条例》（RGPD）。",
  sections: [
    {
      heading: "数据处理责任方",
      paragraphs: [
        "Maori Surf Camp Unipessoal, Lda.（Jhonny Surf Store），NIF 516569783，注册地址为 Rua Machado dos Santos n.º 514, Loja A.B, 2775-236 Parede。",
      ],
    },
    {
      heading: "我们收集哪些数据",
      bullets: [
        "你在联系我们或下单时向我们提供的联系信息（姓名、电话、邮箱）。",
        "注册时的账户与个人资料信息，包括用户名、地址、年龄/出生日期、性别、客户类型与偏好。",
        "购物车、订单、付款以及自取/配送数据。",
        "通过 WhatsApp、Instagram 或电子邮件产生的沟通数据。",
        "根据你在同意横幅中的选择所收集的 Cookie 与浏览数据。",
      ],
    },
    {
      heading: "我们如何使用数据",
      bullets: [
        "回复咨询并管理订单。",
        "管理客户账户、购物车、结账、付款、订单邮件以及评价邀请。",
        "仅在存在有效营销同意时，发送购物车提醒或到访未购买提醒。",
        "提供售后支持、保修与维修。",
        "履行法律与税务义务。",
      ],
    },
    {
      heading: "数据共享",
      paragraphs: [
        "我们不会出售你的数据。仅与提供服务所必需的合作方共享，包括运输、支付（例如在启用时的 Ifthenpay、PayPal 或 Klarna）、交易邮件，以及法律要求时的法律/税务工具。",
        "下一阶段，部分客户、产品、库存与订单数据可能与 Jhonny 的 Odoo 账户同步，用于运营管理。",
      ],
    },
    {
      heading: "保存期限",
      paragraphs: [
        "我们仅在实现所述目的及适用法定期限所需的时间内保存数据。",
      ],
    },
    {
      heading: "你的权利",
      paragraphs: [
        "你可以通过所示渠道，申请查阅、更正、删除或可携带你的数据，也可以反对处理。你还有权向葡萄牙国家数据保护委员会（CNPD）提出投诉。",
      ],
    },
  ],
};

export default function Page() {
  return <InfoPage pt={pt} en={en} zh={zh} />;
}
