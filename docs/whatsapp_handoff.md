# WhatsApp Handoff

Owner: Rodrigo

## Goal

Let an approved business owner ask operational questions through WhatsApp and receive answers from the same backend tools used by the web app.

## Current Backend Endpoint

```text
POST /webhooks/whatsapp
```

Local backend URL:

```text
http://127.0.0.1:8000
```

The FastAPI webhook uses the same agent path as the app chat endpoint:

```text
POST /chat
```

The endpoint accepts:

- Twilio-style form payloads with `From` and `Body`
- WhatsApp Cloud API-style JSON webhook payloads

If the request is Twilio form encoded, the backend returns TwiML. If it is JSON, the backend returns JSON:

```json
{
  "answer": "Today's sales are EUR 494.75 from 11 orders."
}
```

## Environment

```env
WHATSAPP_ALLOWED_NUMBERS=351900000000,351911111111
WHATSAPP_RATE_LIMIT_PER_MINUTE=20
PUBLIC_WHATSAPP_WEBHOOK_URL=https://your-public-url/webhooks/whatsapp
TWILIO_AUTH_TOKEN=replace-with-twilio-auth-token
WHATSAPP_APP_SECRET=replace-with-meta-app-secret
```

If `WHATSAPP_ALLOWED_NUMBERS` is empty, all senders are allowed. For a real pilot, set this to the approved phone numbers only.

For Twilio, set `TWILIO_AUTH_TOKEN` and keep `PUBLIC_WHATSAPP_WEBHOOK_URL` equal to the webhook URL configured in Twilio. For Meta WhatsApp Cloud API, set `WHATSAPP_APP_SECRET` to verify `X-Hub-Signature-256`. If these secrets are absent, local testing still works, but production signature checks are disabled.

## Rodrigo Tasks

1. Choose provider:
   - Fastest demo: Twilio WhatsApp sandbox
   - Better production path: Meta WhatsApp Business Cloud API
2. Point inbound WhatsApp messages to:

```text
https://your-public-url/webhooks/whatsapp
```

3. For local testing, expose the local backend with a tunnel such as ngrok or Cloudflare Tunnel.
4. Test these prompts:

```text
How much did we sell today?
What is the stock value?
What categories sold today?
What is low stock?
```

5. Add production safeguards before a client rollout:
   - Set provider signature secret
   - Restrict phone numbers
   - Confirm inbound and outbound message logs
   - Keep rate limits enabled
   - Avoid sending sensitive customer data over WhatsApp

## Local Test

With the backend running on `http://127.0.0.1:8000`:

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8000/webhooks/whatsapp `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"From":"351900000000","Body":"How much did we sell today?"}'
```

For Twilio-style form payloads:

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8000/webhooks/whatsapp `
  -Method POST `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "From=whatsapp:%2B351900000000&Body=How%20much%20did%20we%20sell%20today%3F"
```

Cloud hosting is not required for app development. Only add a public URL when WhatsApp provider testing needs inbound internet access.

## Demo Positioning

WhatsApp is the owner interface. The app is for dashboards; WhatsApp is for fast answers while the owner is on the shop floor.
