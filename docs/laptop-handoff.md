# Laptop Handoff

Owner: Tiago

Last updated: 2026-07-15

This document captures project context for restoring and continuing work on a new laptop. It complements the other handoff docs in `docs/`.

## Project Overview

One Git repo, three deliverables:

| Deliverable | Code folders | Purpose | Live hosting |
|---|---|---|---|
| Retail agent app | `src/` + `frontend/` | Dashboards, analytics, assisted agent chat | Azure App Service |
| WhatsApp feature | `src/` (`POST /webhooks/whatsapp`) | Owner asks business questions via WhatsApp | Same Azure backend API |
| Jhonny website | `website/` | Public storefront, shop, partners, Instagram | Vercel (planned/current) or Azure |

WhatsApp is not a separate app. It is an endpoint on the same FastAPI backend used by the agent app.

## GitHub Repo

- Repo: https://github.com/Tiago-Domingues/jhonny_ai
- Personal account: `Tiago-Domingues`
- Branch: `main`

### Important: restore from the release, not only from `main`

As of 2026-07-15, `main` on GitHub may still be behind local work if push was blocked by the EY corporate network (Zscaler blocks `git push`).

Use the full backup release:

- Releases page: https://github.com/Tiago-Domingues/jhonny_ai/releases
- Backup release: https://github.com/Tiago-Domingues/jhonny_ai/releases/tag/backup-2026-07-15
- Download: `jhonny-complete.bundle` (full repo)

### Restore on new laptop

```powershell
gh auth login
gh release download backup-2026-07-15 -R Tiago-Domingues/jhonny_ai
git clone jhonny-complete.bundle jhonny
cd jhonny
```

If a newer release exists, download that instead of `backup-2026-07-15`.

Then install dependencies:

```powershell
py -m pip install -r requirements.txt
cd frontend
npm install
cd ../website
npm install
cd ..
```

Create env files from templates:

```powershell
copy .env.example .env
copy website\.env.example website\.env.local
```

Fill in real values from Azure App Service settings, Vercel env vars, or your password manager.

### Optional: sync GitHub `main` from a non-EY network

If push was blocked on the old laptop, run this from home Wi-Fi or a phone hotspot:

```powershell
git remote set-url origin https://github.com/Tiago-Domingues/jhonny_ai.git
git push origin main
```

After that, a normal `git clone` of `main` will also work.

## What Is In Git vs Not

### In git / release backup

- Agent backend and frontend
- Full website project
- Docs, scripts, deploy configs
- Brand assets (images, videos) committed to the repo
- `.env.example` templates

### Not in git (must recreate or copy separately)

- `.env` (agent secrets)
- `website/.env.local` (website secrets)
- `website/prisma/dev.db` (local SQLite database)
- `node_modules/`, `.next/` (reinstall/regenerate)
- Cursor chat history and local IDE-only context

## Run Locally

### Agent app

Backend:

```powershell
py scripts/run_app.py
```

Frontend:

```powershell
cd frontend
npm run dev
```

URLs:

- App: http://127.0.0.1:3000
- API: http://127.0.0.1:8000
- Health: http://127.0.0.1:8000/health

Demo tokens:

- `retail-demo` — live/private Odoo data
- `Jhonny-demo` — anonymized share-safe data

### Website

```powershell
cd website
npm run dev
```

Default local URL: http://127.0.0.1:3000 (use a different port if the agent frontend is already running).

## Live Cloud Services

### Azure (agent app + WhatsApp backend)

Resource group used by deploy script: `rg-jhonny-retail-poc`

| Service | URL |
|---|---|
| Backend API | https://jhonny-retail-api-a92e4ffb.azurewebsites.net |
| Agent web app | https://jhonny-retail-web-a92e4ffb.azurewebsites.net |
| WhatsApp webhook | https://jhonny-retail-api-a92e4ffb.azurewebsites.net/webhooks/whatsapp |

Deploy script:

```powershell
.\scripts\deploy_azure_app_service.ps1
```

Requires Azure CLI login:

```powershell
az login
```

Backend secrets live in Azure App Service configuration, not in git.

### Vercel (website)

The public website in `website/` is intended for Vercel.

- `.vercelignore` excludes local DB, env files, and build caches from deploys
- `.vercel/` is gitignored and must be recreated with `vercel link` on a new machine if using the CLI

### Twilio / WhatsApp

Twilio sends inbound WhatsApp messages to the Azure webhook URL above.

See `docs/whatsapp_handoff.md` for setup details, allowed numbers, and signature env vars.

## Hosting Recommendation

You do not need both Azure and Vercel forever.

| Option | Setup |
|---|---|
| Simplest ops | All on Azure: backend, agent UI, website |
| Best Next.js DX for website | Azure for backend + agent, Vercel for `website/` |

Do not move the Python backend to Vercel-only hosting without refactoring.

## Useful Docs In Repo

- `docs/app_handoff.md` — agent app scope and demo flow
- `docs/whatsapp_handoff.md` — WhatsApp/Twilio setup
- `docs/deployment.md` — hosting notes and env vars
- `docs/jhonny-retail-agent-poc-plan.md` — POC plan
- `website/AGENTS.md` — website agent notes

## Cursor On New Laptop

Git restores code and docs, not chat history.

After restore:

1. Open the `jhonny` folder in Cursor
2. Sign in to the same Cursor account
3. Point the AI at this file and the other docs in `docs/`
4. Recreate `.env` files before running or deploying

## Quick Verification Checklist

After restore, confirm:

- [ ] `git log -1` shows the expected latest commit
- [ ] `src/`, `frontend/`, and `website/` folders exist
- [ ] `py scripts/run_app.py` starts the API
- [ ] `cd frontend && npm run dev` starts the agent app
- [ ] `cd website && npm run dev` starts the website
- [ ] Azure URLs above still respond
- [ ] `.env` and `website/.env.local` are recreated with real secrets

## Local Size vs Git Size

The project folder can be 2+ GB locally because of:

- `node_modules/`
- `.next/`
- `website/prisma/dev.db`
- `.git` object store

The git release bundle is much smaller because it only contains tracked source and assets. That is expected.
