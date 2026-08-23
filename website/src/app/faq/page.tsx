import type { Metadata } from "next";
import { InfoPage, type InfoContent } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Perguntas Frequentes",
  description:
    "Respostas às perguntas mais comuns sobre a Jhonny Surf Store: loja, compras, reparações e mais.",
};

const pt: InfoContent = {
  title: "Perguntas Frequentes",
  intro: "As respostas rápidas às dúvidas mais comuns. Não encontras o que procuras? Fala connosco.",
  sections: [
    {
      heading: "Onde fica a loja?",
      paragraphs: [
        "Estamos na Rua Machado dos Santos n.º 514, Loja A.B, 2775-236 Parede — a poucos minutos de Carcavelos.",
      ],
    },
    {
      heading: "Já posso comprar online?",
      paragraphs: [
        "Sim. Compra em jhonnysurfstore.com com MB WAY, Multibanco, cartão, PayPal ou Klarna. Podes levantar na loja em Parede ou pedir envio para casa. Portes grátis acima de €100; pranchas e artigos volumosos confirmamos contigo. WhatsApp, telefone ou Instagram continuam abertos se precisares de ajuda.",
      ],
    },
    {
      heading: "Recebo fatura?",
      paragraphs: [
        "Sim. Depois do pagamento enviamos o fatura-recibo oficial (Odoo) para o teu email, com cupão e portes iguais ao checkout.",
      ],
    },
    {
      heading: "Como recupero a password?",
      paragraphs: [
        "Em Conta → Esqueceste a password? Enviamos um link para o email da conta. Contas só com Google entram com Google.",
      ],
    },
    {
      heading: "O que é o JHONNY10?",
      paragraphs: [
        "10% na primeira compra com conta. Entra, aplica JHONNY10 no checkout, e o desconto só fica gravado depois do pagamento.",
      ],
    },
    {
      heading: "Ajudam a escolher a prancha certa?",
      paragraphs: [
        "Sim. O aconselhamento faz parte do nosso ADN. Diz-nos o teu nível, peso e as ondas que costumas surfar e ajudamos a encontrar o equipamento ideal.",
      ],
    },
    {
      heading: "Fazem reparações de pranchas?",
      paragraphs: [
        "Sim, através de parceiros de confiança. Traz a prancha à loja e avaliamos a reparação contigo.",
      ],
    },
    {
      heading: "Compram pranchas usadas?",
      paragraphs: [
        "Sim, temos serviço de recompra (buy-back). Contacta-nos com fotos e detalhes da prancha para uma avaliação.",
      ],
    },
    {
      heading: "Têm vantagens para estudantes Erasmus?",
      paragraphs: [
        "Sim. Consulta a página de Vantagens Erasmus ou pergunta na loja.",
      ],
    },
  ],
};

const en: InfoContent = {
  title: "Frequently Asked Questions",
  intro: "Quick answers to the most common questions. Can't find what you need? Talk to us.",
  sections: [
    {
      heading: "Where is the store?",
      paragraphs: [
        "We're at Rua Machado dos Santos n.º 514, Loja A.B, 2775-236 Parede — a few minutes from Carcavelos.",
      ],
    },
    {
      heading: "Can I buy online?",
      paragraphs: [
        "Yes. Shop at jhonnysurfstore.com with MB WAY, Multibanco, card, PayPal or Klarna. Pick up in Parede or ship to your address. Free shipping over €100; bulky boards are confirmed with you. WhatsApp, phone or Instagram are still there if you need help.",
      ],
    },
    {
      heading: "Do I get an invoice?",
      paragraphs: [
        "Yes. After payment we email the official fatura-recibo (Odoo), with the same coupon and shipping as checkout.",
      ],
    },
    {
      heading: "How do I reset my password?",
      paragraphs: [
        "In Account → Forgot your password? We send a link to the account email. Google-only accounts sign in with Google.",
      ],
    },
    {
      heading: "What is JHONNY10?",
      paragraphs: [
        "10% off your first purchase with an account. Sign in, apply JHONNY10 at checkout; the discount is stored only after payment.",
      ],
    },
    {
      heading: "Do you help me choose the right board?",
      paragraphs: [
        "Yes. Advice is part of our DNA. Tell us your level, weight and the waves you usually surf and we'll help you find the ideal gear.",
      ],
    },
    {
      heading: "Do you repair surfboards?",
      paragraphs: [
        "Yes, through trusted partners. Bring your board to the store and we'll assess the repair with you.",
      ],
    },
    {
      heading: "Do you buy used boards?",
      paragraphs: [
        "Yes, we have a buy-back service. Contact us with photos and details of the board for an assessment.",
      ],
    },
    {
      heading: "Are there perks for Erasmus students?",
      paragraphs: [
        "Yes. See the Erasmus Perks page or ask us in the store.",
      ],
    },
  ],
};

const zh: InfoContent = {
  title: "常见问题",
  intro: "最常见问题的快速解答。找不到你需要的？请联系我们。",
  sections: [
    {
      heading: "店在哪里？",
      paragraphs: [
        "我们位于 Rua Machado dos Santos n.º 514, Loja A.B, 2775-236 Parede——距 Carcavelos 仅几分钟路程。",
      ],
    },
    {
      heading: "现在可以在线上购买吗？",
      paragraphs: [
        "可以。在 jhonnysurfstore.com 用 MB WAY、Multibanco、银行卡、PayPal 或 Klarna 下单。可到 Parede 门店自取或配送到家。满 €100 免运费；大件冲浪板我们会再确认。WhatsApp、电话或 Instagram 仍可用于咨询。",
      ],
    },
    {
      heading: "有发票吗？",
      paragraphs: [
        "有。付款后我们会把正式 fatura-recibo（Odoo）发到你的邮箱，优惠码和运费与结账一致。",
      ],
    },
    {
      heading: "如何重置密码？",
      paragraphs: [
        "在账户页点击“忘记密码？”。我们会把链接发到账户邮箱。仅 Google 登录的账户请继续用 Google。",
      ],
    },
    {
      heading: "JHONNY10 是什么？",
      paragraphs: [
        "注册账户首次购买享 10% 优惠。登录后在结账输入 JHONNY10；折扣只在付款后计入。",
      ],
    },
    {
      heading: "你们会帮我选择合适的冲浪板吗？",
      paragraphs: [
        "会。专业建议是我们的核心。告诉我们你的水平、体重和常冲的浪点，我们会帮你找到理想装备。",
      ],
    },
    {
      heading: "你们维修冲浪板吗？",
      paragraphs: [
        "会，通过值得信赖的合作伙伴。把板带到店里，我们一起评估维修方案。",
      ],
    },
    {
      heading: "你们收购二手冲浪板吗？",
      paragraphs: [
        "会，我们提供回购服务。请发送冲浪板照片和详情，我们会进行评估。",
      ],
    },
    {
      heading: "Erasmus 学生有优惠吗？",
      paragraphs: [
        "有。请查看 Erasmus 优惠页面，或直接到店咨询。",
      ],
    },
  ],
};

export default function Page() {
  return <InfoPage pt={pt} en={en} zh={zh} />;
}
