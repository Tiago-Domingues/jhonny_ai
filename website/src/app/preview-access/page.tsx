import { redirect } from "next/navigation";

/** Preview password unlock is retired now that the shop is public. */
export default function PreviewAccessPage() {
  redirect("/");
}
