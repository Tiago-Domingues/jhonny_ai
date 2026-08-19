import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { VolumeCalculatorClient } from "@/components/VolumeCalculatorClient";

export const metadata: Metadata = {
  title: "Calculadora de volume",
  description:
    "Descobre o volume ideal da tua prancha de surf com base no teu peso, idade, nível e condições de surf.",
};

export default function VolumeCalculatorPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-paper pb-20 pt-28 sm:pt-36">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Link
            href="/loja?categoryGroup=surfboards"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
          >
            <span aria-hidden>←</span> Surfboards
          </Link>

          <h1 className="font-display mt-6 text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
            Calculadora de volume
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink/75">
            O volume é um dos factores mais importantes na escolha da prancha certa. Influencia a
            flutuação, a estabilidade e a facilidade com que apanhas ondas.
          </p>

          <div className="mt-10">
            <VolumeCalculatorClient />
          </div>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
