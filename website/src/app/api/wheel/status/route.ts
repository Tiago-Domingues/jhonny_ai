import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { apiError, unavailableError } from "@/lib/ecommerce/api";
import { readSessionUser } from "@/lib/ecommerce/session";
import { readWheelStatus } from "@/lib/ecommerce/wheelSpins";
import { currentPeriodKey } from "@/lib/ecommerce/prizeWheel";

export async function GET() {
  if (!hasDatabaseUrl()) return unavailableError();

  try {
    const session = await readSessionUser();
    // Not an error: the wheel is members-only, so the client renders a
    // sign-in prompt rather than a failure.
    if (!session) {
      return Response.json({
        signedIn: false,
        eligible: false,
        prize: null,
        periodKey: currentPeriodKey(),
      });
    }

    const status = await readWheelStatus(session.id);
    return Response.json({ signedIn: true, ...status });
  } catch (error) {
    return apiError(error);
  }
}
