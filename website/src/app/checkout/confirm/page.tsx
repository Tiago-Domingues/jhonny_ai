import { redirect } from "next/navigation";

type ConfirmPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = (await searchParams) || {};
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) query.set(key, value);
  }
  redirect(`/checkout/obrigado${query.toString() ? `?${query.toString()}` : ""}`);
}
