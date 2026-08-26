import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { CheckoutClient } from "@/components/CheckoutClient";
import { CheckoutHeading } from "@/components/CheckoutHeading";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Checkout Jhonny Surf Store com MB WAY, Multibanco, Klarna, Google Pay, Revolut Pay e pickup em loja.",
};

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto w-full max-w-[90rem] px-5 sm:px-8">
          <CheckoutHeading />
          <div className="mt-10">
            <CheckoutClient />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
