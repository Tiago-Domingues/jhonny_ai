import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { readSessionUser } from "@/lib/ecommerce/session";
import { enforceRateLimit } from "@/lib/ecommerce/securityRuntime";
import { spinWheel } from "@/lib/ecommerce/wheelSpins";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();
  const limited = enforceRateLimit(request, "wheel-spin", 10, 60_000);
  if (limited) return limited;

  try {
    const session = await readSessionUser();
    if (!session) {
      return Response.json(
        { error: "sign_in_required", message: "Sign in to spin the prize wheel." },
        { status: 401 }
      );
    }

    const status = await spinWheel(session.id);
    return Response.json({ signedIn: true, ...status });
  } catch (error) {
    return apiError(error);
  }
}
