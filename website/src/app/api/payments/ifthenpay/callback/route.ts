import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { readJson, unavailableError } from "@/lib/ecommerce/api";
import { markPaymentPaid } from "@/lib/ecommerce/payments";
import {
  enforceRateLimit,
  isProductionRuntime,
  secretsEqual,
} from "@/lib/ecommerce/securityRuntime";

export const maxDuration = 300;

function parseAmountCents(payload: Record<string, unknown>) {
  const raw =
    payload.amount ??
    payload.Amount ??
    payload.valor ??
    payload.Valor ??
    payload.value ??
    payload.Value;
  if (raw == null || raw === "") return null;
  const num = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
  if (!Number.isFinite(num)) return null;
  // Ifthenpay usually sends euros as decimal string ("12.50").
  if (Number.isInteger(num) && Math.abs(num) >= 1000) return Math.round(num);
  return Math.round(num * 100);
}

function extractSecret(payload: Record<string, unknown>, request: Request) {
  return String(
    request.headers.get("x-ifthenpay-secret") ||
      request.headers.get("x-callback-secret") ||
      payload.key ||
      payload.chave ||
      payload.secret ||
      payload.antiPhishingKey ||
      payload.AntiPhishingKey ||
      payload.anti_phishing_key ||
      ""
  );
}

function extractReference(payload: Record<string, unknown>) {
  const reference =
    payload.providerReference ||
    payload.orderId ||
    payload.OrderId ||
    payload.order_id ||
    payload.id ||
    payload.referencia ||
    payload.Reference ||
    payload.reference ||
    payload.RequestId ||
    payload.requestId ||
    payload.request_id;
  return reference == null || reference === "" ? null : String(reference);
}

function extractStatus(payload: Record<string, unknown>) {
  const status = payload.status ?? payload.Status ?? payload.estado ?? payload.Estado;
  return status == null || status === "" ? null : String(status);
}

async function handleIfthenpayCallback(request: Request, payload: Record<string, unknown>) {
  if (!hasDatabaseUrl()) return unavailableError();

  const limited = enforceRateLimit(request, "ifthenpay-callback", 60, 60_000);
  if (limited) return limited;

  const expectedSecret = process.env.IFTHENPAY_CALLBACK_SECRET?.trim();
  const suppliedSecret = extractSecret(payload, request);

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

  const reference = extractReference(payload);
  if (!reference) {
    return Response.json({ error: "missing_payment_reference" }, { status: 400 });
  }

  const status = extractStatus(payload);
  const amountCents = parseAmountCents(payload);

  try {
    const paid = await markPaymentPaid(reference, {
      amountCents,
      status,
    });
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
