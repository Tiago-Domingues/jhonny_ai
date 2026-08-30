import { redirect } from "next/navigation";

export default function AdminClientesRedirect() {
  redirect("/admin?tab=clientes");
}
