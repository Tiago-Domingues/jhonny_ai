import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SurfConditions } from "@/components/SurfConditions";
import { Products } from "@/components/Products";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { Brands } from "@/components/Brands";
import { Opportunities } from "@/components/Opportunities";
import { Visit } from "@/components/Visit";
import { Contact } from "@/components/Contact";
import { Athletes } from "@/components/Athletes";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SurfConditions />
        <Products />
        <About />
        <Services />
        <Brands />
        <Opportunities />
        <Visit />
        <Contact />
        <Athletes />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
