import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { CartPageClient } from "@/components/CartPageClient";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Carrinho Jhonny Surf Store — altera quantidades e continua para o checkout.",
};

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto w-full max-w-[90rem] px-5 sm:px-8">
          <CartPageClient />
        </section>
      </main>
      <Footer />
    </>
  );
}
