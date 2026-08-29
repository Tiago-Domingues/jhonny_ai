import type { Metadata } from "next";
import { InfoPage, type InfoContent } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Termos e Condições",
  description:
    "Termos e condições de utilização do site e da loja Jhonny Surf Store em Parede / Carcavelos.",
};

const pt: InfoContent = {
  title: "Termos e Condições",
  updated: "Última atualização: 2026",
  intro:
    "Estes termos regem a utilização do site da Jhonny Surf Store e a relação comercial connosco, seja na loja física ou através dos canais digitais. Ao navegar no site ou ao efetuar uma compra, aceitas as condições descritas abaixo.",
  sections: [
    {
      heading: "1. Identificação",
      paragraphs: [
        "A marca Jhonny Surf Store é explorada por Maori Surf Camp Unipessoal, Lda., com sede na Rua Machado dos Santos n.º 514, Loja A.B, 2775-236 Parede, contribuinte fiscal 516569783.",
      ],
    },
    {
      heading: "2. Produtos e preços",
      paragraphs: [
        "Descrevemos os produtos com o maior rigor possível. Imagens e cores podem variar ligeiramente em função do ecrã utilizado.",
        "Os preços incluem IVA à taxa legal em vigor. Reservamo-nos o direito de corrigir erros de preço evidentes antes de confirmar qualquer encomenda.",
      ],
    },
    {
      heading: "3. Compras",
      paragraphs: [
        "A loja online permite compras com conta de cliente ou como convidado. A encomenda só fica confirmada depois de o pagamento ser iniciado ou confirmado, conforme o método escolhido.",
        "A disponibilidade e o preço final são validados no checkout. Na fase de ligação ao Odoo, o catálogo online será sincronizado com o stock e produtos da conta Odoo do Jhonny.",
      ],
    },
    {
      heading: "3A. Conta de cliente e convidado",
      paragraphs: [
        "Podes criar conta para guardar perfil, moradas, preferências e histórico de compras, ou comprar como convidado sem password.",
        "Comunicações de marketing, lembretes de carrinho e mensagens após visita sem compra só são enviados quando existir consentimento válido.",
      ],
    },
    {
      heading: "4. Disponibilidade",
      paragraphs: [
        "Trabalhamos com stock limitado e edições sazonais. A disponibilidade de um produto só é garantida após confirmação connosco.",
      ],
    },
    {
      heading: "5. Propriedade intelectual",
      paragraphs: [
        "Os conteúdos do site (textos, imagens, logótipos e identidade visual) pertencem à Jhonny Surf Store ou aos respetivos titulares e não podem ser reproduzidos sem autorização.",
      ],
    },
    {
      heading: "6. Lei aplicável e foro",
      paragraphs: [
        "Estes termos regem-se pela lei portuguesa. Em caso de litígio, e sem prejuízo dos direitos do consumidor, é competente o foro da comarca de Lisboa.",
      ],
    },
  ],
};

const en: InfoContent = {
  title: "Terms & Conditions",
  updated: "Last updated: 2026",
  intro:
    "These terms govern the use of the Jhonny Surf Store website and our commercial relationship with you, whether in the physical store or through our digital channels. By browsing the site or making a purchase, you accept the conditions below.",
  sections: [
    {
      heading: "1. Who we are",
      paragraphs: [
        "The Jhonny Surf Store brand is operated by Maori Surf Camp Unipessoal, Lda., registered at Rua Machado dos Santos n.º 514, Loja A.B, 2775-236 Parede, Portugal, tax number 516569783.",
      ],
    },
    {
      heading: "2. Products and prices",
      paragraphs: [
        "We describe products as accurately as possible. Images and colours may vary slightly depending on your screen.",
        "Prices include VAT at the legal rate in force. We reserve the right to correct obvious pricing errors before confirming any order.",
      ],
    },
    {
      heading: "3. Purchases",
      paragraphs: [
        "The online store supports customer accounts and guest checkout. An order is confirmed only after payment is started or confirmed, depending on the selected payment method.",
        "Availability and final price are validated at checkout. During the Odoo integration phase, the online catalog will be synchronized with Jhonny's Odoo products and stock.",
      ],
    },
    {
      heading: "3A. Customer account and guest checkout",
      paragraphs: [
        "You can create an account to save profile details, addresses, preferences and order history, or checkout as a guest without a password.",
        "Marketing messages, cart reminders and no-purchase reminders are sent only when valid consent exists.",
      ],
    },
    {
      heading: "4. Availability",
      paragraphs: [
        "We work with limited stock and seasonal editions. Availability of a product is only guaranteed after confirmation with us.",
      ],
    },
    {
      heading: "5. Intellectual property",
      paragraphs: [
        "Website content (texts, images, logos and visual identity) belongs to Jhonny Surf Store or its respective owners and may not be reproduced without authorisation.",
      ],
    },
    {
      heading: "6. Governing law",
      paragraphs: [
        "These terms are governed by Portuguese law. In the event of a dispute, and without prejudice to consumer rights, the courts of Lisbon shall have jurisdiction.",
      ],
    },
  ],
};

const zh: InfoContent = {
  title: "条款与条件",
  updated: "最后更新：2026",
  intro:
    "本条款规范 Jhonny Surf Store 网站的使用，以及你与我们的商业关系，无论是实体店还是通过数字渠道。浏览网站或完成购买，即表示你接受以下所述条件。",
  sections: [
    {
      heading: "1. 身份说明",
      paragraphs: [
        "Jhonny Surf Store 品牌由 Maori Surf Camp Unipessoal, Lda. 经营，注册地址为 Rua Machado dos Santos n.º 514, Loja A.B, 2775-236 Parede，税务识别号（NIF）516569783。",
      ],
    },
    {
      heading: "2. 产品与价格",
      paragraphs: [
        "我们尽可能准确地描述产品。图片与颜色可能因所用屏幕而略有差异。",
        "价格含现行法定税率的增值税（IVA）。我们保留在确认任何订单前更正明显价格错误的权利。",
      ],
    },
    {
      heading: "3. 购买",
      paragraphs: [
        "网店支持使用客户账户购买，也可以访客身份购买。订单仅在付款已启动或已确认后成立，具体取决于所选支付方式。",
        "库存与最终价格在结账时核验。在对接 Odoo 阶段，在线目录将与 Jhonny 的 Odoo 账户中的库存和产品同步。",
      ],
    },
    {
      heading: "3A. 客户账户与访客",
      paragraphs: [
        "你可以创建账户以保存个人资料、地址、偏好与购买记录，或以访客身份购买而无需密码。",
        "营销通讯、购物车提醒以及到访未购买后的消息，仅在存在有效同意时才会发送。",
      ],
    },
    {
      heading: "4. 供应情况",
      paragraphs: [
        "我们库存有限，并有季节限定款。产品供应仅在与我们确认后方可保证。",
      ],
    },
    {
      heading: "5. 知识产权",
      paragraphs: [
        "网站内容（文字、图片、标志与视觉识别）归 Jhonny Surf Store 或其各自权利人所有，未经授权不得复制。",
      ],
    },
    {
      heading: "6. 适用法律与管辖",
      paragraphs: [
        "本条款受葡萄牙法律管辖。如发生争议，在不影响消费者权利的前提下，由里斯本（Lisboa）法院管辖。",
      ],
    },
  ],
};

export default function Page() {
  return <InfoPage pt={pt} en={en} zh={zh} />;
}
