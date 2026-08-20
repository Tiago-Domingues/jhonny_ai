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

### Where the Vercel variables actually are

They are **not** in GitHub secrets. Open this page (must be logged into the Vercel account that owns the store):

[vercel.com/tiagopaixaodomingues-6296s-projects/website/settings/environment-variables](https://vercel.com/tiagopaixaodomingues-6296s-projects/website/settings/environment-variables)

Click path if that link does not land correctly:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard).
2. Top-left **team switcher**: select **tiagopaixaodomingues-6296's projects** (not a personal Hobby team).
3. Open the project named **website** (this is the shop; do not open a different app in the same team).
4. In the project sidebar choose **Settings**, then **Environment Variables** (on some dashboards it is a top-level **Environment Variables** item).
5. In the search box type `IFTHENPAY`. Filter **Production**.

You should see these names (already set on Production + Preview):

- `IFTHENPAY_MBWAY_KEY`
- `IFTHENPAY_MB_KEY`
- `IFTHENPAY_CALLBACK_SECRET`
- `IFTHENPAY_CALLBACK_URL`

`IFTHENPAY_MBWAY_KEY`, `IFTHENPAY_MB_KEY`, and `IFTHENPAY_CALLBACK_URL` are **Sensitive**. Clicking those rows / “Copied” only copies the **name**, not the secret. That is expected. You do **not** need those values in the Ifthenpay callback screen.

`IFTHENPAY_CALLBACK_SECRET` is the anti-phishing key. It is stored as a normal (encrypted) variable so you **can** reveal it:

1. Open the [Environment Variables](https://vercel.com/tiagopaixaodomingues-6296s-projects/website/settings/environment-variables) page above.
2. Search `IFTHENPAY_CALLBACK_SECRET`.
3. Click the **eye** icon on that row to show the value, then copy it.
4. Paste that value into Ifthenpay as **chave anti-phishing**.

Do not edit `IFTHENPAY_MBWAY_KEY` / `IFTHENPAY_MB_KEY` unless Ifthenpay gave you new payment keys. The backoffice key Ifthenpay asks for when saving callbacks is **not** in Vercel; it lives in the Ifthenpay admin profile.

Official help: [Configurar ou alterar os dados para CALLBACK](https://helpdesk.ifthenpay.com/pt-PT/support/solutions/articles/79000139402-configurar-ou-alterar-os-dados-para-callback) · [Callback guide](https://www.ifthenpay.com/docs/en/guides/callback/)

---

## 2. URLs to paste in Ifthenpay (exact)

Use **www.jhonnysurfstore.com** even if the customer checked out on `.pt`. Both domains are the same Vercel app.

The Ifthenpay backoffice **rejects** English placeholders (`[ANTI_PHISHING_KEY]`, `[ORDER_ID]`) and also rejects a URL that already contains the real secret. Use these official Portuguese templates. Leave every `[PLACEHOLDER]` as written. Put the secret only in **Chave anti-phishing**.

### Multibanco account

```
https://www.jhonnysurfstore.com/api/payments/ifthenpay/callback?chave=[CHAVE_ANTI_PHISHING]&entidade=[ENTIDADE]&referencia=[REFERENCIA]&valor=[VALOR]&datahorapag=[DATA_HORA_PAGAMENTO]&terminal=[TERMINAL]
```

### MB WAY account

```
https://www.jhonnysurfstore.com/api/payments/ifthenpay/callback?chave=[CHAVE_ANTI_PHISHING]&referencia=[REFERENCIA]&idpedido=[ID_TRANSACAO]&valor=[VALOR]&datahorapag=[DATA_HORA_PAGAMENTO]&estado=[ESTADO]
```

---

## 3. Steps in the Ifthenpay backoffice

Do **not** paste `IFTHENPAY_CALLBACK_SECRET` back into Vercel. Paste it into Ifthenpay, in **chave anti-phishing**. You also paste a **different** value into **URL de callback** (the long URL from §2, not the short Vercel `IFTHENPAY_CALLBACK_URL`).

Admin profile required. Login: [backoffice.ifthenpay.com](https://backoffice.ifthenpay.com/).

1. Sign in (utilizador + password of the store Ifthenpay contract).
2. Left menu: **Administração** → **Contrato** (sometimes **Dados de Contrato**).
3. You will see a list of payment accounts (Multibanco, MB WAY, …).
4. On the **Multibanco** row, open the options and click the **?** icon (callback / configuration). This only shows for administrator users.
5. A configuration window opens with three different fields:

   | Field in Ifthenpay | What to paste |
   |--------------------|----------------|
   | **URL de callback** | The matching URL from §2 (the long one with `[CHAVE_ANTI_PHISHING]`, `[REFERENCIA]`, …). Leave the `[PLACEHOLDERS]` as written. |
   | **Chave anti-phishing** | The value you copied from Vercel **`IFTHENPAY_CALLBACK_SECRET`**. Max 50 characters. |
   | **Chave de backoffice** | **Not** a Vercel variable. It is Ifthenpay’s own admin key (on the original Ifthenpay PDF, or shown on this Contrato page). |

6. Click **ATIVAR** (or Guardar). Ifthenpay may ask again for the **chave de backoffice** → paste it → **Confirmar**.
7. Close the window. Repeat steps 4–6 on the **MB WAY** row, using the **MB WAY** URL from §2 and the **same** anti-phishing key.

If there is no **?** icon and no callback fields, the login is not an administrator. Use an admin user, or email Ifthenpay (below) instead of fighting the UI.

### Alternative: ask Ifthenpay to configure it

Email [callback@ifthenpay.com](mailto:callback@ifthenpay.com) with:

- NIF associated with the contract
- Accounts to configure (MB WAY + Multibanco)
- The two URLs from §2
- The anti-phishing key (same value as Vercel)

Support: [suporte@ifthenpay.com](mailto:suporte@ifthenpay.com) · +351 256 245 560 · 808 222 777

---

## 4. Confirm Vercel (already expected to be set)

See the dashboard link in §1. On Production (and Preview if you test there) these names should exist:

- `IFTHENPAY_MBWAY_KEY`
- `IFTHENPAY_MB_KEY`
- `IFTHENPAY_CALLBACK_SECRET` (anti-phishing key; value is hidden because it is Sensitive)
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
