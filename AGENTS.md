# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **monorepo with two independent products** that both talk to the same external **Odoo ERP** (XML-RPC). Node 22 and Python 3.12 are used.

- **Retail agent + WhatsApp** — Python FastAPI backend in `app/src/` + a Next.js UI in `app/frontend/`. WhatsApp is `POST /webhooks/whatsapp` on that same API.
- **E-commerce website** — full-stack Next.js app in `website/` (Prisma + local SQLite). See `website/AGENTS.md` for the Next.js 16 conventions caveat.

Dependencies (`pip install -r app/requirements.txt`, `npm install` in `app/frontend/` and `website/`) are refreshed by the startup update script; the notes below are the non-obvious runtime caveats.

### Ports (conflict!)
Both `app/frontend/` and `website/` default to **port 3000**. Only one can own 3000 at a time — run the other on an alternate port, e.g. `npm run dev -- -p 3001`. The FastAPI backend uses **8000**.

### Retail agent + WhatsApp (`app/`)
- Run backend from `app/`: `python3 scripts/run_app.py` (serves `src.api:app` on `127.0.0.1:8000`). `pip` installs the `uvicorn` console script to `~/.local/bin` (not on PATH), so launch via `python3` / `python3 -m uvicorn`, not the bare `uvicorn` command.
- Run UI: `cd app/frontend && npm run dev` (reads `NEXT_PUBLIC_API_BASE_URL`, default `http://127.0.0.1:8000`).
- **The backend hard-requires real Odoo credentials.** The agent is built lazily on the first `/dashboard`, `/chat`, or `/tools/*` request via `create_agent()`, which calls `OdooClient.authenticate()`. With the placeholder `ODOO_*` values in `app/.env.example`, those endpoints return HTTP 503 `odoo_unavailable`. Only `GET /health` (→ `{"status":"ok"}`) works without valid Odoo creds. Full dashboard/chat testing needs real `ODOO_URL/ODOO_DB/ODOO_USERNAME/ODOO_API_KEY` (and optionally `OPENAI_API_KEY`).
- Offline regression checks that need **no** Odoo/OpenAI: `cd app && python3 scripts/evaluate_agent.py` and `python3 scripts/evaluate_api_security.py` (they use fake tools / signature fixtures).
- Next Azure zip deploy: run `app/scripts/deploy_azure_app_service.ps1` (package root is `app/`).

### E-commerce website (`website/`)
- Requires `website/.env` with at least `DATABASE_URL` and `SESSION_SECRET`. Create it from `website/.env.example` and set a real `SESSION_SECRET` (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
- Create the local SQLite DB before first run: `cd website && npx prisma db push` (creates `prisma/dev.db`, git-ignored). `prisma generate` already runs on `npm install` (postinstall).
- Run: `cd website && npm run dev` (port 3000).
- The shop is public. Set `SITE_COMING_SOON=true` only as an emergency lock (coming-soon + `Disallow: /`). Preview-password unlock is retired.
- Works fully **without Odoo**: when the DB has no products, the catalog falls back to 3 built-in mock products (`src/lib/ecommerce/catalog.ts`), so browsing, registration, and add-to-cart all work offline. Live catalog sync only happens when `ODOO_LIVE_CATALOG=true` and real Odoo creds are set.
- **Production DB schema:** GitHub Actions runs `prisma db push` on every deploy (`.github/workflows/deploy-website.yml`) using `DATABASE_URL` from Vercel production env — no manual migration step after merges.
- **Email gotcha:** `.env.example` ships `EMAIL_PROVIDER="smtp"` with placeholder Gmail creds. Registration and order flows call `sendEmail`, and SMTP/Resend only *skip* when their credentials are **empty**; set-but-invalid creds make sending **throw**, which breaks registration with HTTP 400 (the user row is still created). For local dev, blank `SMTP_USER`, `SMTP_PASSWORD`, and `RESEND_API_KEY` in `website/.env` so emails record as `SKIPPED` instead of failing.
- Manual/cloud-agent Vercel deploy: `VERCEL_TOKEN=... ./website/scripts/deploy-website.sh`

### Lint status (pre-existing, not env issues)
- `app/frontend/` `npm run lint` runs `next lint`, which was **removed in Next 16** — the script errors out. This is a stale script in the repo, not a setup problem.
- `website/` `npm run lint` (eslint) runs but currently reports one pre-existing error in `src/components/Header.tsx` (`@next/next/no-html-link-for-pages`).
