# Agent + WhatsApp (`app/`)

Retail agent POC: FastAPI in `src/` + Next.js UI in `frontend/`. WhatsApp is `POST /webhooks/whatsapp` on the same API, not a separate service.

## Run

From this folder (`app/`):

```bash
python3 -m pip install -r requirements.txt
cp .env.example .env   # fill Odoo + APP_AUTH_TOKEN
python3 scripts/run_app.py
```

```bash
cd frontend
npm install
npm run dev
```

- UI: http://127.0.0.1:3000
- API: http://127.0.0.1:8000
- Health: `GET /health` → `{"status":"ok"}`

Demo tokens: `retail-demo` (live Odoo), `Jhonny-demo` (anonymized).

## Offline checks (no Odoo / OpenAI)

```bash
python3 scripts/evaluate_agent.py
python3 scripts/evaluate_api_security.py
```

## Odoo / chat checks (need real creds)

```bash
python3 scripts/test_connection.py
python3 scripts/smoke_openai_chat.py "How much did we sell today?"
```

The agent is built lazily on the first `/dashboard`, `/chat`, or `/tools/*` call. Placeholder `ODOO_*` values yield HTTP 503 `odoo_unavailable`.

## Azure

Zip deploy: `scripts/deploy_azure_app_service.ps1` (this folder is the package root).

| Service | URL |
|---|---|
| API | https://jhonny-retail-api-a92e4ffb.azurewebsites.net |
| UI | https://jhonny-retail-web-a92e4ffb.azurewebsites.net |
| WhatsApp | https://jhonny-retail-api-a92e4ffb.azurewebsites.net/webhooks/whatsapp |

See `docs/whatsapp_handoff.md` and `docs/deployment.md`.
