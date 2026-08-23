"use client";

import { useEffect, useState } from "react";
import { CurrencyPrice } from "@/components/CurrencyDisplay";
import type { Locale } from "@/lib/i18n";
import { storefrontText } from "@/lib/storefrontCopy";

type AccountOrder = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: string;
  createdAt: string;
  paidAt: string | null;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  couponCode: string | null;
  items: Array<{ id: string; name: string; quantity: number; totalCents: number }>;
  payment: {
    method: string;
    status: string;
    amountCents: number;
    multibancoEntity: string | null;
    multibancoReference: string | null;
  } | null;
};

function statusLabel(status: string, locale: Locale) {
  const map: Record<string, Record<Locale, string>> = {
    PENDING_PAYMENT: { pt: "Aguarda pagamento", en: "Awaiting payment", zh: "待付款" },
    PAID: { pt: "Pago", en: "Paid", zh: "已付款" },
    PREPARING: { pt: "A preparar", en: "Preparing", zh: "备货中" },
    READY_FOR_PICKUP: { pt: "Pronto a levantar", en: "Ready for pickup", zh: "可自取" },
    SHIPPED: { pt: "Enviado", en: "Shipped", zh: "已发货" },
    DELIVERED: { pt: "Entregue", en: "Delivered", zh: "已送达" },
    CANCELLED: { pt: "Cancelado", en: "Cancelled", zh: "已取消" },
    REFUNDED: { pt: "Reembolsado", en: "Refunded", zh: "已退款" },
  };
  return map[status]?.[locale] || status;
}

export function AccountOrders({ locale }: { locale: Locale }) {
  const copy = storefrontText(locale).account;
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((response) => (response.ok ? response.json() : { orders: [] }))
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]));
  }, []);

  return (
    <section id="encomendas" className="rounded-3xl border border-line bg-white p-6 shadow-sm lg:col-span-2">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{copy.ordersKicker}</p>
      <p className="mt-2 text-sm text-muted">{copy.ordersIntro}</p>
      {orders === null ? (
        <div className="mt-5 h-20 animate-pulse rounded-2xl bg-cream" />
      ) : orders.length === 0 ? (
        <div className="mt-5">
          <p className="text-sm text-muted">{copy.ordersEmpty}</p>
          <a href="/loja" className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">
            {copy.ordersShop}
          </a>
        </div>
      ) : (
        <div className="mt-5 divide-y divide-line">
          {orders.map((order) => (
            <article key={order.id} className="grid gap-2 py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-extrabold uppercase">{order.orderNumber}</h3>
                <p className="text-sm font-semibold text-muted">{statusLabel(order.status, locale)}</p>
              </div>
              <p className="text-sm text-muted">
                {new Date(order.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : locale === "en" ? "en-GB" : "pt-PT")}
                {" · "}
                {order.fulfillmentMethod === "SHIP_TO_ADDRESS" ? copy.orderShip : copy.orderPickup}
              </p>
              <ul className="text-sm text-ink">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity} × {item.name} — <CurrencyPrice cents={item.totalCents} />
                  </li>
                ))}
              </ul>
              {order.couponCode && (
                <p className="text-sm text-muted">
                  {copy.orderCoupon} {order.couponCode}
                  {order.discountCents > 0 ? (
                    <>
                      {" "}
                      (−
                      <CurrencyPrice cents={order.discountCents} />)
                    </>
                  ) : null}
                </p>
              )}
              <p className="text-sm text-muted">
                {copy.orderPortes}:{" "}
                {order.shippingCents > 0 ? <CurrencyPrice cents={order.shippingCents} /> : "—"}
              </p>
              <p className="font-semibold">
                Total <CurrencyPrice cents={order.totalCents} />
              </p>
              {order.status === "PENDING_PAYMENT" && order.payment && (
                <div className="rounded-2xl bg-cream px-4 py-3 text-sm">
                  <p className="font-semibold">{copy.orderPendingPay}</p>
                  {order.payment.method === "MULTIBANCO" && (
                    <>
                      <p>
                        {copy.orderEntity}: {order.payment.multibancoEntity || "—"}
                      </p>
                      <p>
                        {copy.orderReference}: {order.payment.multibancoReference || "—"}
                      </p>
                    </>
                  )}
                  <p>
                    {order.payment.method} · <CurrencyPrice cents={order.payment.amountCents} />
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
