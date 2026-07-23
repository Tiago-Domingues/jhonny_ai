# Website Vercel deploy

Live storefront: [jhonnysurfstore.com](https://www.jhonnysurfstore.com) · [jhonnysurfstore.pt](https://www.jhonnysurfstore.pt)

Vercel project: `website`  
Team: `tiagopaixaodomingues-6296s-projects`  
Root directory on Vercel: `website`

## Auto-deploy (recommended)

GitHub Actions workflow: `.github/workflows/deploy-website.yml`

Deploys production on every push to `main` that touches `website/**` (and on manual **Run workflow**).

### One-time secret

1. Open [vercel.com/account/tokens](https://vercel.com/account/tokens) → **Create**
2. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
3. New secret name: `VERCEL_TOKEN` (paste the token)

Org/project IDs are already in the workflow. No other secrets required for deploy.

### Optional: native Vercel Git integration

If you also want Vercel’s built-in GitHub auto-deploy (previews per PR):

1. Vercel → project **website** → **Settings** → **Git**
2. Connect `Tiago-Domingues/jhonny_ai` if disconnected
3. Set **Root Directory** to `website`
4. Production branch: `main`

Native Git auto-deploy has been unreliable for this monorepo; prefer the Actions workflow above as the source of truth.

## Manual / cloud-agent deploy

```bash
export VERCEL_TOKEN=...   # from vercel.com/account/tokens
./scripts/deploy-website.sh
```

Or add `VERCEL_TOKEN` as a **Cursor Cloud environment secret** so agents can run the same script without pasting tokens in chat.

## Pre-launch public gate

Until the shop is ready for purchases:

1. Keep **`SITE_PUBLIC_LAUNCH`** unset or `false` on Vercel (default after this feature ships).
2. Set **`SITE_PREVIEW_PASSWORD`** to a long private password (Vercel → Project → Settings → Environment Variables → Production).
3. Public visitors on **www.jhonnysurfstore.com** / **.pt** only see `/coming-soon`.
4. You review the full site at **https://www.jhonnysurfstore.com/preview-access** (enter the password once; cookie lasts 30 days).

When go-live is approved, set `SITE_PUBLIC_LAUNCH=true` and redeploy (or wait for next `main` deploy).

Optional: also enable Vercel **Deployment Protection** as a second lock, but the in-app gate is enough for hiding the unfinished shop.
