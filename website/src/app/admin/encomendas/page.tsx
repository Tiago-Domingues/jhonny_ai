import { redirect } from "next/navigation";

export default function AdminEncomendasRedirect() {
  redirect("/admin?tab=encomendas");
}
