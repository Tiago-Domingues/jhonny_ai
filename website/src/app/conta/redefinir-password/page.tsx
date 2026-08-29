import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { ResetPasswordClient, InvalidResetLink } from "@/components/PasswordResetClient";

export const metadata: Metadata = {
  title: "Reset password",
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
            <InvalidResetLink />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
