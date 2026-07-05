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
        "A loja online está em preparação. Para já, podes comprar na loja física ou encomendar por WhatsApp, telefone ou Instagram.",
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
      heading: "Can I buy online yet?",
      paragraphs: [
        "The online store is being prepared. For now, you can buy in the physical store or order via WhatsApp, phone or Instagram.",
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

export default function Page() {
  return <InfoPage pt={pt} en={en} />;
}
