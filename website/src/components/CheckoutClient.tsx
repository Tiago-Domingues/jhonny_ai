"use client";

import { FormEvent, useEffect, useState } from "react";
import { CurrencyNote, CurrencyPrice, CurrencySelector } from "@/components/CurrencyDisplay";
import { CartQtyControls } from "@/components/CartQtyControls";
import { useLanguage } from "@/components/LanguageProvider";
import { FREE_SHIPPING_THRESHOLD_EUROS, shippingQuoteFor } from "@/lib/ecommerce/shipping";
import { CHECKOUT_PAYMENT_METHODS, getCheckoutPaymentMethod, isLiveCheckoutPaymentMethod } from "@/lib/ecommerce/paymentMethods";
import { PaymentMethodMark } from "@/components/PaymentIcons";
import { isValidOptionalNif } from "@/lib/ecommerce/nif";
import { useCartSummary } from "@/lib/ecommerce/cartClient";
import { shopperStockError, storefrontText } from "@/lib/storefrontCopy";

type CheckoutPayment = {
  method?: string;
  status?: string;
  amountCents?: number;
  multibancoEntity?: string | null;
  multibancoReference?: string | null;
  mbwayPhone?: string | null;
  providerPaymentUrl?: string | null;
};

type CheckoutResult = {
  orderNumber: string;
  payment: CheckoutPayment | null;
};

type Prefill = {
  fullName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  nif: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
};

const PAYMENT_METHODS = CHECKOUT_PAYMENT_METHODS;

export function CheckoutClient() {
  const { locale } = useLanguage();
  const copy = storefrontText(locale).checkout;
  const cart = useCartSummary();
  const [message, setMessage] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("MBWAY");
  const [fulfillmentMethod, setFulfillmentMethod] = useState("PICKUP_IN_STORE");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscountCents, setCouponDiscountCents] = useState(0);
  const [couponPercentOff, setCouponPercentOff] = useState(0);
  const [shipCountry, setShipCountry] = useState("PT");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    const canceled = new URLSearchParams(window.location.search).get("canceled");
    if (canceled === "1") setMessage(copy.canceled);
  }, [copy.canceled]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((session) => {
        const user = session?.user;
        if (!user) return;
        return fetch("/api/profile")
          .then((response) => (response.ok ? response.json() : null))
          .then((data) => {
            const profile = data?.user?.profile || {};
            const nextCountry = String(profile.country || "PT");
            setShipCountry(nextCountry);
            setPrefill({
              fullName: String(profile.fullName || user.fullName || ""),
              email: String(user.email || ""),
              phone: String(profile.phone || ""),
              phoneCountryCode: String(profile.phoneCountryCode || "+351"),
              nif: String(profile.nif || "").replace(/^PT/, ""),
              addressLine1: String(profile.addressLine1 || ""),
              addressLine2: String(profile.addressLine2 || ""),
              postalCode: String(profile.postalCode || ""),
              city: String(profile.city || ""),
              country: nextCountry,
            });
          });
      })
      .catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setCheckoutResult(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const phone = String(payload.phone || "").trim();
    const mbwayPhone = String(payload.mbwayPhone || "").trim();
    if (paymentMethod === "MBWAY" && !mbwayPhone && !phone) {
      setMessage(copy.needMbway);
      setSubmitting(false);
      return;
    }
    if (!isValidOptionalNif(String(payload.nif || ""))) {
      setMessage(copy.invalidNif);
      setSubmitting(false);
      return;
    }
    if (!isLiveCheckoutPaymentMethod(paymentMethod)) {
      setMessage(copy.paymentNotLive);
      setSubmitting(false);
      return;
    }
    if (fulfillmentMethod === "SHIP_TO_ADDRESS") {
      const addressLine1 = String(payload.addressLine1 || "").trim();
      const postalCode = String(payload.postalCode || "").trim();
      const city = String(payload.city || "").trim();
      if (addressLine1.length < 3 || postalCode.length < 3 || city.length < 2) {
        setMessage(copy.needAddress);
        setSubmitting(false);
        return;
      }
    }
    if (!billingSameAsShipping) {
      const billingAddressLine1 = String(payload.billingAddressLine1 || "").trim();
      const billingPostalCode = String(payload.billingPostalCode || "").trim();
      const billingCity = String(payload.billingCity || "").trim();
      if (billingAddressLine1.length < 3 || billingPostalCode.length < 3 || billingCity.length < 2) {
        setMessage(copy.needBilling);
        setSubmitting(false);
        return;
      }
    }
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          fulfillmentMethod,
          paymentMethod,
          marketingOptIn: form.get("marketingOptIn") === "on",
          billingSameAsShipping: fulfillmentMethod === "PICKUP_IN_STORE" ? true : billingSameAsShipping,
          returnOrigin: window.location.origin,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const fieldError = data.fields
          ? Object.values(data.fields)
              .flat()
              .find((value) => typeof value === "string" && value.trim())
          : null;
        setMessage(fieldError || shopperStockError(data.message || copy.failed, locale));
        return;
      }
      if (data.payment?.providerPaymentUrl) {
        window.location.href = data.payment.providerPaymentUrl;
        return;
      }
      setCheckoutResult({
        orderNumber: data.order.orderNumber,
        payment: data.payment || null,
      });
      window.dispatchEvent(new Event("jss-cart-updated"));
    } catch {
      setMessage(copy.failed);
    } finally {
      setSubmitting(false);
    }
  }

  async function applyCoupon() {
    setCouponMessage(null);
    setCouponDiscountCents(0);
    setCouponPercentOff(0);
    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode }),
    });
    const data = await response.json();
    if (!response.ok) {
      setCouponMessage(data.message || copy.couponInvalid);
      return;
    }
    setCouponDiscountCents(data.discountCents || 0);
    setCouponPercentOff(Number(data.coupon?.percentOff || 0));
    setCouponCode(data.coupon?.code || couponCode);
    setCouponMessage(`${data.coupon?.code} ${copy.couponApplied}: ${data.coupon?.percentOff}% off.`);
  }

  const discountedSubtotalCents = Math.max(0, cart.subtotalCents - couponDiscountCents);
  const shippingQuote = shippingQuoteFor({
    fulfillmentMethod: fulfillmentMethod === "SHIP_TO_ADDRESS" ? "SHIP_TO_ADDRESS" : "PICKUP_IN_STORE",
    amountAfterDiscountCents: discountedSubtotalCents,
    destinationCountry: shipCountry,
    items: cart.items.map((item) => ({
      quantity: item.quantity,
      weightKg: item.weightKg,
      lengthCm: item.lengthCm,
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      category: item.category,
      name: item.name,
    })),
  });
  const payableCents = discountedSubtotalCents + shippingQuote.shippingCents;
  const payment = checkoutResult?.payment;
  const fieldClass = "w-full rounded-2xl border border-line px-4 py-3";

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(13rem,16.5rem)]">
      <form key={prefill?.email || "guest"} onSubmit={submit} className="min-w-0 rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="fullName" required placeholder={copy.fullName} defaultValue={prefill?.fullName} className={fieldClass} />
            <input name="email" required type="email" placeholder={copy.email} defaultValue={prefill?.email} className={fieldClass} />
          </div>
          <div className="grid w-full grid-cols-[7.25rem_minmax(0,1fr)] gap-2">
            <select name="phoneCountryCode" defaultValue={prefill?.phoneCountryCode || "+351"} className="w-full min-w-0 rounded-2xl border border-line px-3 py-3">
              <option value="+351">PT +351</option>
              <option value="+34">ES +34</option>
              <option value="+33">FR +33</option>
              <option value="+44">UK +44</option>
              <option value="+49">DE +49</option>
              <option value="+1">US/CA +1</option>
            </select>
            <input name="phone" required placeholder={copy.phone} defaultValue={prefill?.phone} className="w-full min-w-0 rounded-2xl border border-line px-4 py-3" />
          </div>
          {paymentMethod === "MBWAY" && (
            <input
              name="mbwayPhone"
              placeholder={copy.mbwayPhone}
              required
              defaultValue={prefill?.phone}
              className={fieldClass}
            />
          )}
          <div>
            <input name="nif" placeholder={copy.nif} defaultValue={prefill?.nif} className={fieldClass} />
            <p className="mt-1 text-xs text-muted">{copy.nifHelp}</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted">{copy.delivery}</p>
            <div className="grid gap-2 md:grid-cols-2">
              <button type="button" onClick={() => { setFulfillmentMethod("PICKUP_IN_STORE"); setBillingSameAsShipping(true); }} className={`rounded-2xl border px-4 py-3 text-left font-semibold ${fulfillmentMethod === "PICKUP_IN_STORE" ? "border-ink bg-ink text-white" : "border-line"}`}>
                {copy.pickup}
              </button>
              <button type="button" onClick={() => setFulfillmentMethod("SHIP_TO_ADDRESS")} className={`rounded-2xl border px-4 py-3 text-left font-semibold ${fulfillmentMethod === "SHIP_TO_ADDRESS" ? "border-ink bg-ink text-white" : "border-line"}`}>
                {copy.ship}
              </button>
            </div>
          </div>

          {fulfillmentMethod === "SHIP_TO_ADDRESS" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="addressLine1" required placeholder={copy.address} defaultValue={prefill?.addressLine1} className={`${fieldClass} sm:col-span-2`} />
              <input name="addressLine2" placeholder={copy.addressDetails} defaultValue={prefill?.addressLine2} className={`${fieldClass} sm:col-span-2`} />
              <input name="postalCode" required placeholder={copy.postalCode} defaultValue={prefill?.postalCode} className={fieldClass} />
              <input name="city" required placeholder={copy.city} defaultValue={prefill?.city} className={fieldClass} />
              <select
                name="country"
                defaultValue={prefill?.country || "PT"}
                onChange={(event) => setShipCountry(event.target.value)}
                className={fieldClass}
              >
                <option value="PT">Portugal</option>
                <option value="ES">Espanha</option>
                <option value="FR">França</option>
                <option value="GB">Reino Unido</option>
                <option value="DE">Alemanha</option>
                <option value="US">Estados Unidos</option>
                <option value="BR">Brasil</option>
                <option value="CH">Suíça</option>
              </select>
            </div>
          )}

          {fulfillmentMethod === "SHIP_TO_ADDRESS" && (
            <label className="flex items-center gap-2 text-sm text-muted">
              <input checked={billingSameAsShipping} onChange={(event) => setBillingSameAsShipping(event.currentTarget.checked)} type="checkbox" className="mt-1" />
              {copy.billingSame}
            </label>
          )}

          {fulfillmentMethod === "SHIP_TO_ADDRESS" && !billingSameAsShipping && (
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="billingAddressLine1" required placeholder={copy.billingAddress} className={`${fieldClass} sm:col-span-2`} />
              <input name="billingAddressLine2" placeholder={copy.billingDetails} className={`${fieldClass} sm:col-span-2`} />
              <input name="billingPostalCode" required placeholder={copy.billingPostal} className={fieldClass} />
              <input name="billingCity" required placeholder={copy.billingCity} className={fieldClass} />
              <select name="billingCountry" defaultValue="PT" className={fieldClass}>
                <option value="PT">Portugal</option>
                <option value="ES">Espanha</option>
                <option value="FR">França</option>
                <option value="GB">Reino Unido</option>
                <option value="DE">Alemanha</option>
                <option value="US">Estados Unidos</option>
                <option value="BR">Brasil</option>
                <option value="CH">Suíça</option>
              </select>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted">{copy.payment}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((method) => {
                const selected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left ${
                      selected ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{method.label}</span>
                      {!method.live && (
                        <span className={`block text-[0.65rem] font-semibold uppercase tracking-wide ${selected ? "text-white/70" : "text-muted"}`}>
                          {copy.comingSoon}
                        </span>
                      )}
                    </span>
                    <PaymentMethodMark method={method.id} />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-muted">{getCheckoutPaymentMethod(paymentMethod)?.hint}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              name="couponCode"
              value={couponCode}
              onChange={(event) => {
                setCouponCode(event.currentTarget.value);
                setCouponDiscountCents(0);
                setCouponMessage(null);
              }}
              placeholder={copy.coupon}
              className="rounded-2xl border border-line px-4 py-3"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={!couponCode.trim()}
              className="rounded-full border border-line px-5 py-3 text-sm font-bold uppercase tracking-wide text-ink disabled:opacity-50"
            >
              {copy.applyCoupon}
            </button>
            {couponMessage && <p className="text-sm text-muted md:col-span-2">{couponMessage}</p>}
          </div>

          <textarea name="notes" placeholder={copy.notes} className={fieldClass} />
          <label className="flex items-start gap-2 text-sm text-muted">
            <input name="marketingOptIn" type="checkbox" className="mt-1" />
            {copy.marketing}
          </label>
          <button
            disabled={submitting || Boolean(checkoutResult) || !isLiveCheckoutPaymentMethod(paymentMethod)}
            className="w-full rounded-full bg-ink px-5 py-3 font-bold uppercase tracking-wide text-white disabled:opacity-50"
          >
            {submitting
              ? copy.creating
              : isLiveCheckoutPaymentMethod(paymentMethod)
                ? copy.confirm
                : copy.comingSoon}
          </button>
          {message && <p className="rounded-xl bg-cream p-3 text-sm text-muted">{message}</p>}
          {checkoutResult && (
            <div className="rounded-2xl border border-line bg-cream/60 p-4 text-sm text-ink">
              <p className="font-bold">{copy.orderCreated} {checkoutResult.orderNumber}</p>
              {payment?.method === "MULTIBANCO" && (
                <div className="mt-3 space-y-1">
                  <p>Multibanco</p>
                  <p>
                    <strong>Entidade:</strong> {payment.multibancoEntity || "—"}
                  </p>
                  <p>
                    <strong>Referência:</strong> {payment.multibancoReference || "—"}
                  </p>
                  {typeof payment.amountCents === "number" && (
                    <p>
                      <strong>{copy.total}:</strong> <CurrencyPrice cents={payment.amountCents} />
                    </p>
                  )}
                </div>
              )}
              {payment?.method === "MBWAY" && (
                <div className="mt-3 space-y-1">
                  <p>MB WAY{payment.mbwayPhone ? ` ${payment.mbwayPhone}` : ""}</p>
                  {typeof payment.amountCents === "number" && (
                    <p>
                      <strong>{copy.total}:</strong> <CurrencyPrice cents={payment.amountCents} />
                    </p>
                  )}
                </div>
              )}
              <p className="mt-3 text-muted">{copy.emailSent}</p>
            </div>
          )}
        </div>
      </form>

      <aside className="h-fit min-w-0 rounded-3xl border border-line bg-white p-5 shadow-sm xl:sticky xl:top-36">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{copy.summary}</p>
        <div className="mt-4 space-y-4">
          {cart.items.length ? (
            cart.items.map((item) => (
              <div key={item.id} className="text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                  <span className="min-w-0 font-semibold">{item.name}</span>
                  <span className="font-semibold sm:text-right"><CurrencyPrice cents={item.totalCents} /></span>
                </div>
                <CartQtyControls
                  itemId={item.id}
                  quantity={item.quantity}
                  stockQuantity={item.stockQuantity}
                  onError={setCartError}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">{checkoutResult ? copy.orderCreated : copy.emptyCart}</p>
          )}
          {cartError && <p className="text-sm text-muted">{cartError}</p>}
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-2 flex justify-between text-sm text-muted">
            <span>{copy.subtotal}</span>
            <span><CurrencyPrice cents={cart.subtotalCents} /></span>
          </div>
          {couponDiscountCents > 0 && (
            <div className="mb-2 flex justify-between text-sm font-semibold text-muted">
              <span>
                {copy.couponDiscount}
                {couponPercentOff ? ` ${couponCode} −${couponPercentOff}%` : ""}
              </span>
              <span>-<CurrencyPrice cents={couponDiscountCents} /></span>
            </div>
          )}
          <div className="mb-3 flex items-start justify-between gap-3 text-sm text-muted">
            <span className="shrink-0">{copy.shipping}</span>
            <span className="min-w-0 text-right">
              {shippingQuote.shippingCents > 0 ? (
                <CurrencyPrice cents={shippingQuote.shippingCents} />
              ) : shippingQuote.freeReason === "threshold" ? (
                copy.shippingFree.replace("{threshold}", String(FREE_SHIPPING_THRESHOLD_EUROS))
              ) : (
                copy.shippingPickup
              )}
            </span>
          </div>
          {shippingQuote.note === "bulky" && (
            <p className="mb-3 text-xs text-muted">{copy.shippingBulky}</p>
          )}
          <div className="flex flex-col gap-1 font-display text-2xl font-extrabold sm:flex-row sm:justify-between">
            <span>{copy.total}</span>
            <span className="sm:text-right"><CurrencyPrice cents={payableCents} /></span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <CurrencySelector compact />
            <CurrencyNote />
          </div>
          <p className="mt-2 text-xs text-muted">
            {copy.freeShipping.replace("{threshold}", String(FREE_SHIPPING_THRESHOLD_EUROS))}
          </p>
        </div>
      </aside>
    </div>
  );
}
