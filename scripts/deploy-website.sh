#!/usr/bin/env bash
# Deploy website/ to Vercel production using VERCEL_TOKEN.
# Used by cloud agents and local ops when GitHub→Vercel git auto-deploy is offline.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/website"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN."
  echo "Create one at https://vercel.com/account/tokens"
  echo "then export VERCEL_TOKEN=... (or add it as a Cursor Cloud environment secret)."
  exit 1
fi

export VERCEL_ORG_ID="${VERCEL_ORG_ID:-team_xuQfcMjOwvDPxyLNr4PpDHa2}"
export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-prj_61MLIY40SIJ09GLCQuCSQcNNrXkD}"

CLI_VERSION="${VERCEL_CLI_VERSION:-48.12.1}"

cd "$WEB"

if ! command -v vercel >/dev/null 2>&1; then
  npm install --global "vercel@${CLI_VERSION}"
fi

echo "Linking Vercel project (org=$VERCEL_ORG_ID project=$VERCEL_PROJECT_ID)…"
vercel pull --yes --environment=production --token="$VERCEL_TOKEN"

echo "Building production…"
vercel build --prod --token="$VERCEL_TOKEN"

echo "Deploying to production…"
vercel deploy --prebuilt --prod --yes --token="$VERCEL_TOKEN"

echo "Done."
