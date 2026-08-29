import type { Metadata } from "next";
import { InfoPage, type InfoContent } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Segurança e Fraude",
  description:
    "Como nos proteges e como denunciar tentativas de fraude que usem indevidamente a marca Jhonny Surf Store.",
};

const pt: InfoContent = {
  title: "Segurança e Fraude",
  intro:
    "A tua segurança é prioridade. Esta página ajuda-te a identificar e a reportar tentativas de fraude que usem indevidamente o nome ou a imagem da Jhonny Surf Store.",
  sections: [
    {
      heading: "Os nossos canais oficiais",
      paragraphs: [
        "Comunicamos apenas através do nosso site oficial, do Instagram e do WhatsApp indicados nesta página. Desconfia de contas, lojas ou perfis que imitem a nossa marca.",
      ],
    },
    {
      heading: "Sinais de alerta",
      bullets: [
        "Preços demasiado baixos em sites ou perfis que não os nossos.",
        "Pedidos de pagamento por meios não habituais ou para contas pessoais.",
        "Mensagens com erros, pressa anormal ou links suspeitos.",
        "Pedidos de dados sensíveis (passwords, códigos de cartão completos).",
      ],
    },
    {
      heading: "Boas práticas",
      bullets: [
        "Confirma sempre o endereço do site antes de pagar.",
        "Nunca partilhes códigos de MB WAY ou PIN.",
        "Em caso de dúvida, contacta-nos diretamente antes de avançar.",
      ],
    },
    {
      heading: "Como denunciar",
      paragraphs: [
        "Se detetares uma utilização fraudulenta da nossa marca, contacta-nos pelos canais oficiais com o máximo de detalhe (capturas de ecrã, links, contactos). Em casos graves, denuncia também às autoridades competentes.",
      ],
    },
  ],
};

const en: InfoContent = {
  title: "Security & Fraud",
  intro:
    "Your safety is a priority. This page helps you identify and report fraud attempts that misuse the Jhonny Surf Store name or image.",
  sections: [
    {
      heading: "Our official channels",
      paragraphs: [
        "We only communicate through our official website, Instagram and WhatsApp listed on this page. Be wary of accounts, stores or profiles that imitate our brand.",
      ],
    },
    {
      heading: "Warning signs",
      bullets: [
        "Prices that are too low on sites or profiles other than ours.",
        "Requests for payment through unusual means or to personal accounts.",
        "Messages with errors, abnormal urgency or suspicious links.",
        "Requests for sensitive data (passwords, full card codes).",
      ],
    },
    {
      heading: "Good practices",
      bullets: [
        "Always check the website address before paying.",
        "Never share MB WAY codes or PINs.",
        "When in doubt, contact us directly before proceeding.",
      ],
    },
    {
      heading: "How to report",
      paragraphs: [
        "If you spot fraudulent use of our brand, contact us through the official channels with as much detail as possible (screenshots, links, contacts). In serious cases, also report it to the competent authorities.",
      ],
    },
  ],
};

const zh: InfoContent = {
  title: "安全与欺诈",
  intro:
    "你的安全是我们的优先事项。本页帮助你识别并举报滥用 Jhonny Surf Store 名称或形象的欺诈企图。",
  sections: [
    {
      heading: "我们的官方渠道",
      paragraphs: [
        "我们仅通过本页所列的官方网站、Instagram 和 WhatsApp 沟通。请警惕模仿我们品牌的账户、网店或个人资料。",
      ],
    },
    {
      heading: "警示信号",
      bullets: [
        "非我们官方的网站或个人资料上出现过低的价格。",
        "要求通过不常见的方式付款，或付款至个人账户。",
        "信息中有错误、异常催促或可疑链接。",
        "索要敏感数据（密码、完整银行卡验证码）。",
      ],
    },
    {
      heading: "良好做法",
      bullets: [
        "付款前务必核对网站地址。",
        "切勿分享 MB WAY 验证码或 PIN。",
        "如有疑问，请在继续操作前直接联系我们。",
      ],
    },
    {
      heading: "如何举报",
      paragraphs: [
        "若发现对我们品牌的欺诈性使用，请通过官方渠道联系我们，并尽可能提供详情（截图、链接、联系方式）。情节严重时，也请向主管机关举报。",
      ],
    },
  ],
};

export default function Page() {
  return <InfoPage pt={pt} en={en} zh={zh} />;
}
