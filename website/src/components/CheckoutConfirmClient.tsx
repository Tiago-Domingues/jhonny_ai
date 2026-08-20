"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CurrencyPrice } from "@/components/CurrencyDisplay";

type ConfirmState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      paid: boolean;
      orderNumber: string;
      amountCents: number;
      paymentStatus: string;
    };

export function CheckoutConfirmClient() {
  const [state, setState] = useState<ConfirmState>({ status: "loading" });

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id") || "";
    if (!sessionId) {
      setState({ status: "error", message: "Falta a sessão de pagamento Stripe." });
      return;
    }
    fetch(`/api/payments/stripe/session?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || data.error || "Não foi possível confirmar o pagamento.");
        }
        setState({
          status: "ready",
          paid: Boolean(data.paid),
          orderNumber: data.order?.orderNumber || "—",
          amountCents: data.order?.totalCents || data.order?.payment?.amountCents || 0,
          paymentStatus: data.paymentStatus || data.order?.payment?.status || "pending",
        });
        window.dispatchEvent(new Event("jss-cart-updated"));
      })
      .catch((error: unknown) => {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Não foi possível confirmar o pagamento.",
        });
      });
  }, []);

  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      {state.status === "loading" && <p className="text-muted">A confirmar o pagamento…</p>}
      {state.status === "error" && <p className="rounded-xl bg-cream p-3 text-sm text-muted">{state.message}</p>}
      {state.status === "ready" && (
        <div className="space-y-3 text-sm text-ink">
          <p className="font-display text-2xl font-extrabold uppercase">
            {state.paid ? "Pagamento confirmado" : "A aguardar pagamento"}
          </p>
          <p>
            Encomenda <strong>{state.orderNumber}</strong>
          </p>
          {state.amountCents > 0 && (
            <p>
              Valor: <CurrencyPrice cents={state.amountCents} />
            </p>
          )}
          {state.paid ? (
            <p className="text-muted">Enviámos a confirmação por email. Se escolheste levantamento, espera pelo email antes de ires à loja.</p>
          ) : (
            <p className="text-muted">
              O Stripe ainda está a processar ({state.paymentStatus}). Se pagaste com Klarna, isto pode levar uns instantes.
            </p>
          )}
          <Link href="/loja" className="inline-flex rounded-full bg-ink px-5 py-3 font-bold uppercase tracking-wide text-white">
            Continuar a comprar
          </Link>
        </div>
      )}
    </div>
  );
}
