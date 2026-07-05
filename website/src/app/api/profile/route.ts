import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { getProfile, updateProfile } from "@/lib/ecommerce/auth";
import { readSessionUser } from "@/lib/ecommerce/session";

export async function GET() {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await readSessionUser();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const user = await getProfile(session.id);
  return Response.json({ user });
}

export async function PATCH(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const session = await readSessionUser();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    const profile = await updateProfile(session.id, await readJson(request));
    return Response.json({ profile });
  } catch (error) {
    return apiError(error);
  }
}
