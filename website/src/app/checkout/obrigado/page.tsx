import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { CheckoutThanksClient } from "@/components/CheckoutThanksClient";

export const metadata: Metadata = {
  title: "Thanks for shopping with us",
  description: "Thank you for your Jhonny Surf Store order.",
};

export default function CheckoutThanksPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-3xl px-5 sm:px-8">
          <CheckoutThanksClient />
        </section>
      </main>
      <Footer />
    </>
  );
}
