import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { ResetPasswordClient } from "@/components/PasswordResetClient";

export const metadata: Metadata = {
  title: "Redefinir password",
  robots: { index: false, follow: false },
};

export default async function RedefinirPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = String(params.token || "");
  return (
    <>
      <SiteHeader />
      <main className="bg-cream pb-20 pt-36">
        <section className="mx-auto max-w-xl px-5 sm:px-8">
          {token ? (
            <ResetPasswordClient token={token} />
          ) : (
            <p className="rounded-3xl border border-line bg-white p-6 text-sm text-muted">
              Link inválido. Pede um novo em recuperar password.
            </p>
          )}
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
