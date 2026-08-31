"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CurrencyPrice } from "@/components/CurrencyDisplay";
import { useLanguage } from "@/components/LanguageProvider";
import { storefrontText } from "@/lib/storefrontCopy";

type ThanksState =
  | { status: "loading" }
  | { status: "ready"; paid: boolean; orderNumber: string; amountCents: number }
  | { status: "error"; message: string };

export function CheckoutThanksClient() {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).checkout;
  const [state, setState] = useState<ThanksState>({ status: "loading" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id") || "";
    const orderId = params.get("orderId") || "";

    if (!sessionId && !orderId) {
      setState({ status: "ready", paid: true, orderNumber: "", amountCents: 0 });
      return;
    }

    const url = sessionId
      ? `/api/payments/stripe/session?session_id=${encodeURIComponent(sessionId)}`
      : `/api/checkout/thanks?orderId=${encodeURIComponent(orderId)}`;

    fetch(url)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || data.error || copy.failed);
        }
        setState({
          status: "ready",
          paid: Boolean(data.paid),
          orderNumber: data.order?.orderNumber || data.orderNumber || "",
          amountCents: data.order?.totalCents || data.order?.payment?.amountCents || data.amountCents || 0,
        });
        window.dispatchEvent(new Event("jss-cart-updated"));
      })
      .catch((error: unknown) => {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : copy.failed,
        });
      });
  }, [copy.failed]);

  const paid = state.status === "ready" && state.paid;
  const awaiting = state.status === "ready" && !state.paid;

  return (
    <div className="rounded-3xl border border-line bg-white p-8 shadow-sm sm:p-10">
      {state.status === "loading" && <p className="text-muted">{copy.thanksConfirming}</p>}
      {state.status !== "loading" && (
        <div className="space-y-5 text-ink">
          {state.status === "error" && (
            <p className="rounded-xl bg-cream p-3 text-sm text-muted">{state.message}</p>
          )}
          <p className="font-display text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
            {awaiting ? copy.thanksAwaiting : copy.thanksTitle}
          </p>
          {paid ? <p className="text-base text-muted">{copy.thanksBody}</p> : null}
          {state.status === "ready" && state.orderNumber ? (
            <p className="text-sm">
              {copy.thanksOrder} <strong>{state.orderNumber}</strong>
              {state.amountCents > 0 ? (
                <>
                  {" · "}
                  <CurrencyPrice cents={state.amountCents} />
                </>
              ) : null}
            </p>
          ) : null}
          {paid ? <p className="text-sm text-muted">{copy.thanksEmail}</p> : null}
          <Link
            href="/"
            className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-bold uppercase tracking-wide text-white"
          >
            {copy.thanksHome}
          </Link>
        </div>
      )}
    </div>
  );
}
