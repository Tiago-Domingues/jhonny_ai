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

export default function Page() {
  return <InfoPage pt={pt} en={en} />;
}
