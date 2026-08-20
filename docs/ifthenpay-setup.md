# Ifthenpay setup — MB WAY + Multibanco

This is the remaining work to finish Portuguese payments. The website integration is already live; Ifthenpay still has to call our callback URL when a customer pays.

## Website status (already done)

| Piece | Status |
|-------|--------|
| Checkout UI (MB WAY + Multibanco only) | Live |
| Create MB WAY request / Multibanco entity+reference | Live (`website/src/lib/ecommerce/payments.ts`) |
| Post-checkout instructions on screen + email | Live |
| Payment-confirmed emails after callback | Live |
| Callback endpoint | Live at `/api/payments/ifthenpay/callback` (GET + POST) |
| Production fail-closed (no mock refs) | Live |
| Callback secret on Vercel | **Set** — production returns `401 invalid_callback_secret` without the real key |
| Coming-soon gate | Does **not** block `/api/*`, so Ifthenpay can reach the callback while the shop is gated |
| PayPal / Klarna | Out of scope (still placeholders, hidden from checkout) |

Production callback probe (no secret): `GET https://www.jhonnysurfstore.com/api/payments/ifthenpay/callback` → `{"error":"invalid_callback_secret"}`. That means the route is deployed and `IFTHENPAY_CALLBACK_SECRET` is configured. It does **not** mean Ifthenpay is already sending callbacks.

## What is still missing

Register **two** callback URL templates in the Ifthenpay backoffice (one for the MB WAY account, one for the Multibanco account), using the **same anti-phishing key** that is already in Vercel as `IFTHENPAY_CALLBACK_SECRET`.

Until that is done, customers can start a payment (MB WAY push / Multibanco reference) but a successful pay **will not** mark the order `PAID` on the website.

---

## 1. Values you need

From the Ifthenpay contract / backoffice (and already stored on Vercel Production + Preview):

| Item | Where it lives | Used for |
|------|----------------|----------|
| **MB WAY key** | Ifthenpay → MB WAY account | `IFTHENPAY_MBWAY_KEY` |
| **MB key** (dynamic Multibanco) | Ifthenpay → Multibanco account | `IFTHENPAY_MB_KEY` |
| **Backoffice key** | Ifthenpay (admin profile) | Saving callback settings in their UI, or API activation. Not called by the website at runtime. |
| **Anti-phishing key** | You choose it (max **50** characters) | `IFTHENPAY_CALLBACK_SECRET` **and** Ifthenpay callback config. Must be identical. |

Copy the existing anti-phishing value from Vercel → project **website** → Settings → Environment Variables → `IFTHENPAY_CALLBACK_SECRET`. Do not generate a new one unless you also update Vercel and redeploy.

Official help: [Configurar ou alterar os dados para CALLBACK](https://helpdesk.ifthenpay.com/pt-PT/support/solutions/articles/79000139402-configurar-ou-alterar-os-dados-para-callback) · [Callback guide](https://www.ifthenpay.com/docs/en/guides/callback/)

---

## 2. URLs to paste in Ifthenpay (exact)

Use **www.jhonnysurfstore.com** even if the customer checked out on `.pt`. Both domains are the same Vercel app.

### Multibanco account

```
https://www.jhonnysurfstore.com/api/payments/ifthenpay/callback?key=[ANTI_PHISHING_KEY]&orderId=[ORDER_ID]&amount=[AMOUNT]&requestId=[REQUEST_ID]&entity=[ENTITY]&reference=[REFERENCE]&payment_datetime=[PAYMENT_DATETIME]
```

### MB WAY account

```
https://www.jhonnysurfstore.com/api/payments/ifthenpay/callback?key=[ANTI_PHISHING_KEY]&orderId=[ORDER_ID]&amount=[AMOUNT]&requestId=[REQUEST_ID]&payment_datetime=[PAYMENT_DATETIME]
```

Leave the `[PLACEHOLDERS]` as written. Ifthenpay replaces them when it calls us. Do not substitute the anti-phishing key into the URL yourself — Ifthenpay injects it as `key=...`.

If their form asks for **URL** and **chave anti-phishing** as separate fields, paste the URL above and put the Vercel secret in the anti-phishing field.

---

## 3. Steps in the Ifthenpay backoffice

Admin profile required.

1. Sign in at [ifthenpay.com](https://www.ifthenpay.com) (backoffice / área de cliente).
2. Open **Administração → Contrato**.
3. Select the **Multibanco** account.
4. Open callback settings (the **?** / configuration icon on that account).
5. Paste the **Multibanco** URL from §2.
6. Paste the anti-phishing key (same as Vercel `IFTHENPAY_CALLBACK_SECRET`).
7. Confirm with the **chave de backoffice** when the form asks for it.
8. Save.
9. Repeat steps 3–8 for the **MB WAY** account with the **MB WAY** URL.

If the callback fields are missing, the logged-in user is not an administrator. Use an admin login, or email Ifthenpay (below).

### Alternative: ask Ifthenpay to configure it

Email [callback@ifthenpay.com](mailto:callback@ifthenpay.com) with:

- NIF associated with the contract
- Accounts to configure (MB WAY + Multibanco)
- The two URLs from §2
- The anti-phishing key (same value as Vercel)

Support: [suporte@ifthenpay.com](mailto:suporte@ifthenpay.com) · +351 256 245 560 · 808 222 777

---

## 4. Confirm Vercel (already expected to be set)

Vercel → project **website** → Settings → Environment Variables, **Production** (and Preview if you test there):

- `IFTHENPAY_MBWAY_KEY`
- `IFTHENPAY_MB_KEY`
- `IFTHENPAY_CALLBACK_SECRET` (anti-phishing key)
- `IFTHENPAY_CALLBACK_URL` (documentation only; the live path is always `/api/payments/ifthenpay/callback`)

If you change any of these, **redeploy** Production. Env edits do not apply to the current deployment.

Also confirm:

- **Deployment Protection** is off for Production (or has a bypass that still allows unauthenticated GET to `/api/payments/ifthenpay/callback`). A Vercel login wall would make Ifthenpay callbacks fail. A successful `401 invalid_callback_secret` from the URL in the intro means this is currently OK.
- Do not enable a coming-soon / middleware rule that blocks `/api`.

---

## 5. First-order smoke test (after Ifthenpay saves the URLs)

Use preview access (`/preview-access`) if `SITE_PUBLIC_LAUNCH` is still false.

1. Checkout a real catalog product with **Multibanco**.
2. Confirm entidade + referência on the thank-you panel and in the customer + `jhonnysurfstore@gmail.com` emails.
3. Pay the reference (small amount). Within a minute the order should become **PAID** in Admin → Encomendas, and a second “pagamento confirmado” email should go out.
4. Repeat with **MB WAY** on a Portuguese mobile: approve the push in the MB WAY app; same PAID + email outcome.

If the reference is generated but the order stays `PENDING_PAYMENT` after you pay, the backoffice callback is still missing or the anti-phishing key does not match Vercel. Check Vercel function logs for `/api/payments/ifthenpay/callback` (`401` = wrong key, `404` = we could not match the order, no request = Ifthenpay never called us).

---

## 6. What the website does on callback

Ifthenpay sends **GET** with query params. We:

1. Rate-limit the IP.
2. Compare `key` / `chave` to `IFTHENPAY_CALLBACK_SECRET` (constant-time).
3. Find the payment by `orderId`, else `requestId`, else Multibanco `reference`.
4. Reject amount mismatches.
5. Mark payment + order `PAID`, record coupon usage, sync Odoo, send payment-confirmed emails.

A 200 JSON `{ "ok": true, "updated": 1 }` is success. Ifthenpay should retry on non-200 (including `404` if the order id is not in our database yet).
