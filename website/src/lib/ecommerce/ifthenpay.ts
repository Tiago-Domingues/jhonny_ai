/** Ifthenpay MB WAY / SPG Multibanco identifiers are limited to 15 characters. */
export const IFTHENPAY_ORDER_ID_MAX_LEN = 15;

const PAID_CALLBACK_STATUSES = new Set([
  "paid",
  "success",
  "ok",
  "paga",
  "pago",
  "confirmed",
  "completa",
  "complete",
  "000",
  "0",
]);

export function firstNonEmpty(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (value == null || value === "") continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return undefined;
}

/** Compact unique id that fits Ifthenpay's 15-char orderId limit. */
export function ifthenpayOrderId(orderNumber: string, maxLen = IFTHENPAY_ORDER_ID_MAX_LEN) {
  const compact = orderNumber.replace(/^JSS-/i, "").replace(/-/g, "");
  if (compact.length <= maxLen) return compact;
  return compact.slice(-maxLen);
}

export function normalizePaymentReference(value: string) {
  return value.replace(/\s+/g, "");
}

/** Gateway create/init succeeded (customer may still need to pay). */
export function isIfthenpayGatewayAccepted(status: unknown) {
  const raw = String(status ?? "").trim();
  return raw === "" || raw === "0" || raw === "000";
}

/**
 * Ifthenpay only calls the merchant URL after a successful payment.
 * Status is therefore optional; when present it must be a success code.
 */
export function isPaidCallbackStatus(status: string | null | undefined) {
  const statusRaw = String(status ?? "").trim().toLowerCase();
  if (!statusRaw) return true;
  return PAID_CALLBACK_STATUSES.has(statusRaw);
}

export function parseIfthenpayAmountCents(payload: Record<string, unknown>) {
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

export function extractIfthenpaySecret(payload: Record<string, unknown>, request?: Request) {
  return String(
    request?.headers.get("x-ifthenpay-secret") ||
      request?.headers.get("x-callback-secret") ||
      payload.key ||
      payload.chave ||
      payload.secret ||
      payload.antiPhishingKey ||
      payload.AntiPhishingKey ||
      payload.anti_phishing_key ||
      ""
  );
}

export function extractIfthenpayReference(payload: Record<string, unknown>) {
  const reference = firstNonEmpty(
    payload.providerReference,
    payload.orderId,
    payload.OrderId,
    payload.order_id,
    payload.idpedido,
    payload.IdPedido,
    payload.idPedido,
    payload.id_pedido,
    payload.RequestId,
    payload.requestId,
    payload.request_id,
    payload.id,
    payload.referencia,
    payload.Reference,
    payload.reference
  );
  return reference ?? null;
}

export function extractIfthenpayStatus(payload: Record<string, unknown>) {
  const status = payload.status ?? payload.Status ?? payload.estado ?? payload.Estado;
  return status == null || status === "" ? null : String(status);
}

export function ifthenpayCallbackUrlTemplates(origin = "https://www.jhonnysurfstore.com") {
  const base = `${origin.replace(/\/$/, "")}/api/payments/ifthenpay/callback`;
  return {
    multibanco: `${base}?key=[ANTI_PHISHING_KEY]&orderId=[ORDER_ID]&amount=[AMOUNT]&requestId=[REQUEST_ID]&entity=[ENTITY]&reference=[REFERENCE]&payment_datetime=[PAYMENT_DATETIME]`,
    mbway: `${base}?key=[ANTI_PHISHING_KEY]&orderId=[ORDER_ID]&amount=[AMOUNT]&requestId=[REQUEST_ID]&payment_datetime=[PAYMENT_DATETIME]`,
  };
}
