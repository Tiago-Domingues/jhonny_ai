# jhonny_ai

One GitHub repo, two products. Both talk to the same Odoo ERP.

| Product | Folder | What it is | Hosting |
|---|---|---|---|
| Retail agent + WhatsApp | [`app/`](app/) | FastAPI backend, Next.js dashboards/chat, WhatsApp webhook | Azure App Service |
| Jhonny website | [`website/`](website/) | Public storefront and shop | Vercel |

WhatsApp is not a third app. It is `POST /webhooks/whatsapp` on the same Azure API as the agent.

## Quick start

**Agent (from `app/`):**

```bash
cd app
python3 -m pip install -r requirements.txt
cp .env.example .env   # fill real Odoo / token values
python3 scripts/run_app.py
```

```bash
cd app/frontend
npm install
npm run dev
```

- UI: http://127.0.0.1:3000
- API: http://127.0.0.1:8000
- Health: http://127.0.0.1:8000/health
- WhatsApp webhook: `POST /webhooks/whatsapp`

**Website (from `website/`):**

```bash
cd website
cp .env.example .env   # DATABASE_URL + SESSION_SECRET; blank SMTP for local
npx prisma db push
npm install
npm run dev
```

`app/frontend` and `website` both default to port 3000. Run only one on 3000; use `npm run dev -- -p 3001` for the other.

## Docs

| Doc | Path |
|---|---|
| Agent README | [`app/README.md`](app/README.md) |
| Agent + WhatsApp notes | [`app/AGENTS.md`](app/AGENTS.md) |
| WhatsApp handoff | [`app/docs/whatsapp_handoff.md`](app/docs/whatsapp_handoff.md) |
| Website notes | [`website/AGENTS.md`](website/AGENTS.md) |
| Website Vercel deploy | [`website/docs/website-vercel-deploy.md`](website/docs/website-vercel-deploy.md) |
| Laptop restore (both products) | [`docs/laptop-handoff.md`](docs/laptop-handoff.md) |
| Cursor Cloud | [`AGENTS.md`](AGENTS.md) |

## Live URLs

| Service | URL |
|---|---|
| Agent UI | https://jhonny-retail-web-a92e4ffb.azurewebsites.net |
| Agent API | https://jhonny-retail-api-a92e4ffb.azurewebsites.net |
| WhatsApp webhook | https://jhonny-retail-api-a92e4ffb.azurewebsites.net/webhooks/whatsapp |
| Shop | https://www.jhonnysurfstore.com |
