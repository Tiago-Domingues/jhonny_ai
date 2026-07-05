import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { unavailableError } from "@/lib/ecommerce/api";
import { readSessionUser } from "@/lib/ecommerce/session";

export async function GET() {
  if (!hasDatabaseUrl()) return unavailableError();
  const user = await readSessionUser();
  return Response.json({ user });
}
