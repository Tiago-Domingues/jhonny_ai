# Website laptop restore

Owner: Tiago  
Last updated: 2026-07-17  
Scope: **website only** (`website/`)

Use this to copy the latest Jhonny Surf Store website onto your laptop, run it locally, and keep restoring the newest version from GitHub.

## Latest version source of truth

| Source | URL |
|---|---|
| GitHub repo | https://github.com/Tiago-Domingues/jhonny_ai |
| Branch | `main` |
| Website folder | `website/` |
| Website zip release | https://github.com/Tiago-Domingues/jhonny_ai/releases (tag starting with `website-`) |

Expected latest website commit on `main` when this was prepared:

```text
2c5fadd Add laptop handoff doc for new machine setup.
```

Check with:

```powershell
git log -1 --oneline
```

## Option A — recommended: clone the full repo (keeps git history)

```powershell
gh auth login
git clone https://github.com/Tiago-Domingues/jhonny_ai.git
cd jhonny_ai\website
```

Later, restore/update to the newest version:

```powershell
cd jhonny_ai
git checkout main
git pull origin main
cd website
npm install
```

## Option B — download website zip from GitHub release

1. Open: https://github.com/Tiago-Domingues/jhonny_ai/releases
2. Download `jhonny-website-latest.zip` from the newest `website-...` release
3. Unzip into a folder, for example `C:\dev\jhonny-website`
4. Open that folder in Cursor / terminal

If you use `gh`:

```powershell
gh release download website-2026-07-17 -R Tiago-Domingues/jhonny_ai --pattern "jhonny-website-latest.zip"
Expand-Archive .\jhonny-website-latest.zip -DestinationPath .\jhonny-website
cd jhonny-website
```

## Local setup (first time)

```powershell
cd website   # or your unzipped folder
copy .env.example .env.local
npm install
npx prisma db push
npm run dev
```

Open: http://127.0.0.1:3000

### What you must fill in `.env.local`

Secrets are **not** in git. Copy real values from Vercel / password manager into `.env.local`:

- `SESSION_SECRET`
- `ODOO_API_KEY` (and confirm Odoo URL/DB/user)
- Ifthenpay keys if payments are enabled
- SMTP / email settings if order emails are needed
- Instagram Graph tokens if live IG media is needed

For a first visual local run, placeholder values are enough for most pages. Live catalog, checkout, payments, and Instagram need real secrets.

## What is included vs not included

### Included in git / release zip

- Next.js website source (`src/`)
- Brand assets (`public/`, `assets/`, `resources_jhonny/`)
- Prisma schema
- `package.json` / lockfile
- `.env.example`

### Not included (recreate on laptop)

- `.env.local` secrets
- `node_modules/` (run `npm install`)
- `.next/` build cache
- `prisma/dev.db` local SQLite DB (created by `npx prisma db push`)

## Daily workflow on laptop

1. Pull latest:

```powershell
git pull origin main
cd website
npm install
```

2. Run:

```powershell
npm run dev
```

3. When you finish work, commit and push from the repo root so the laptop and GitHub stay aligned:

```powershell
cd ..
git add website
git commit -m "Describe website change"
git push origin main
```

If corporate network blocks `git push`, create a new website zip/release from a non-blocked network (home Wi-Fi / hotspot), same pattern as the full-repo backup release.

## Quick checklist

- [ ] Latest code is on the laptop (`git pull` or fresh zip)
- [ ] `.env.local` exists (copied from `.env.example`)
- [ ] `npm install` completed
- [ ] `npx prisma db push` completed
- [ ] `npm run dev` opens the storefront on http://127.0.0.1:3000
