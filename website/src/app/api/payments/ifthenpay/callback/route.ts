import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { readJson, unavailableError } from "@/lib/ecommerce/api";
import {
  extractIfthenpayReference,
  extractIfthenpaySecret,
  extractIfthenpayStatus,
  parseIfthenpayAmountCents,
} from "@/lib/ecommerce/ifthenpay";
import { markPaymentPaid } from "@/lib/ecommerce/payments";
import {
  enforceRateLimit,
  isProductionRuntime,
  secretsEqual,
} from "@/lib/ecommerce/securityRuntime";

async function handleIfthenpayCallback(request: Request, payload: Record<string, unknown>) {
  if (!hasDatabaseUrl()) return unavailableError();

  const limited = enforceRateLimit(request, "ifthenpay-callback", 60, 60_000);
  if (limited) return limited;

  const expectedSecret = process.env.IFTHENPAY_CALLBACK_SECRET?.trim();
  const suppliedSecret = extractIfthenpaySecret(payload, request);

  if (isProductionRuntime() && !expectedSecret) {
    return Response.json(
      {
        error: "callback_secret_not_configured",
        message: "IFTHENPAY_CALLBACK_SECRET must be set in production.",
      },
      { status: 503 }
    );
  }

  if (expectedSecret && !secretsEqual(suppliedSecret, expectedSecret)) {
    return Response.json({ error: "invalid_callback_secret" }, { status: 401 });
  }

  const reference = extractIfthenpayReference(payload);
  if (!reference) {
    return Response.json({ error: "missing_payment_reference" }, { status: 400 });
  }

  const status = extractIfthenpayStatus(payload);
  const amountCents = parseIfthenpayAmountCents(payload);

  try {
    const paid = await markPaymentPaid(reference, {
      amountCents,
      status,
    });
    if (!paid) {
      return Response.json({ error: "payment_not_found" }, { status: 404 });
    }
    return Response.json({ ok: true, updated: paid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "callback_failed";
    if (message === "amount_mismatch" || message === "invalid_payment_status") {
      return Response.json({ error: message }, { status: 400 });
    }
    return Response.json({ error: "callback_failed", message }, { status: 500 });
  }
}

/** Ifthenpay production callbacks use GET with query-string placeholders. */
export async function GET(request: Request) {
  const payload = Object.fromEntries(new URL(request.url).searchParams.entries()) as Record<
    string,
    unknown
  >;
  return handleIfthenpayCallback(request, payload);
}

/** POST JSON kept for manual/dev testing. */
export async function POST(request: Request) {
  const payload = (await readJson(request)) as Record<string, unknown>;
  return handleIfthenpayCallback(request, payload);
}
