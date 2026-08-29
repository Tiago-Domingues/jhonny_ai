import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { ForgotPasswordClient } from "@/components/PasswordResetClient";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function RecuperarPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-xl px-5 sm:px-8">
          <ForgotPasswordClient />
        </section>
      </main>
      <Footer />
    </>
  );
}
