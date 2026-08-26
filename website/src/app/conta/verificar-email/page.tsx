import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { VerifyEmailClient } from "@/components/VerifyEmailClient";

export const metadata: Metadata = {
  title: "Confirmar email",
  robots: { index: false, follow: false },
};

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-xl px-5 sm:px-8">
          <VerifyEmailClient token={String(params.token || "")} />
        </section>
      </main>
      <Footer />
    </>
  );
}
