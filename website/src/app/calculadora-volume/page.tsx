import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { VolumeCalculatorClient } from "@/components/VolumeCalculatorClient";

export const metadata: Metadata = {
  title: "Volume calculator",
  description:
    "Find the ideal surfboard volume from your weight, age, level, and wave conditions.",
};

export default function VolumeCalculatorPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-paper pb-20 pt-28 sm:pt-36">
        <VolumeCalculatorClient />
      </main>
      <Footer />
    </>
  );
}
