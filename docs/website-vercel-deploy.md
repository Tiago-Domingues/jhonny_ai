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

## Public launch

The shop is public after deploy. Visitors on **www.jhonnysurfstore.com** / **.pt** see the full storefront. `/robots.txt` allows indexing and advertises `/sitemap.xml`.

Emergency hide only: set Vercel `SITE_COMING_SOON=true` and redeploy. Preview-password unlock is retired; `/preview-access` redirects home.
