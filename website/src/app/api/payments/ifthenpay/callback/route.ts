import { hasDatabaseUrl } from "@/lib/ecommerce/db";
import { readJson, unavailableError } from "@/lib/ecommerce/api";
import { markPaymentPaid } from "@/lib/ecommerce/payments";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return unavailableError();

  const payload = await readJson(request);
  const secret = process.env.IFTHENPAY_CALLBACK_SECRET;
  const suppliedSecret =
    request.headers.get("x-ifthenpay-secret") ||
    request.headers.get("x-callback-secret") ||
    payload.secret;

  if (secret && suppliedSecret !== secret) {
    return Response.json({ error: "invalid_callback_secret" }, { status: 401 });
  }

  const reference =
    payload.providerReference ||
    payload.orderId ||
    payload.referencia ||
    payload.reference ||
    payload.RequestId;
  if (!reference) {
    return Response.json({ error: "missing_payment_reference" }, { status: 400 });
  }

  const paid = await markPaymentPaid(String(reference));
  return Response.json({ ok: true, updated: paid });
}
