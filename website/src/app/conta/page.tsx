import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { AccountClient } from "@/components/AccountClient";
import { AccountHeading } from "@/components/AccountHeading";

export const metadata: Metadata = {
  title: "A Minha Conta",
  description: "Conta de cliente Jhonny Surf Store para perfil, moradas, consentimentos e compras.",
};

export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-5xl px-5 sm:px-8">
          <AccountHeading />
          <div className="mt-10">
            <AccountClient />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
