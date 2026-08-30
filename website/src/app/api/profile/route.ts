import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, readJson, unavailableError } from "@/lib/ecommerce/api";
import { getProfile, updateProfile } from "@/lib/ecommerce/auth";
import { readSessionUser } from "@/lib/ecommerce/session";
import { sendWelcomeNotificationsIfProfileReady } from "@/lib/ecommerce/welcomeNotifications";

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
    const user = await getProfile(session.id);
    if (user) {
      await sendWelcomeNotificationsIfProfileReady({
        userId: user.id,
        email: user.email,
        fullName: profile.fullName,
        phoneCountryCode: profile.phoneCountryCode,
        phone: profile.phone,
        addressLine1: profile.addressLine1,
        city: profile.city,
        postalCode: profile.postalCode,
      }).catch(() => null);
    }
    return Response.json({ profile });
  } catch (error) {
    return apiError(error);
  }
}
