#!/usr/bin/env node
/**
 * Idempotently attach shop hosts to the Vercel project.
 * Run from CI with VERCEL_TOKEN + VERCEL_ORG_ID + VERCEL_PROJECT_ID.
 *
 * After a .pt renewal, the registrar must also point nameservers at Vercel
 * (same as .com): ns1.vercel-dns.com + ns2.vercel-dns.com — otherwise the
 * domain stays NXDOMAIN even when attached here.
 */
const token = process.env.VERCEL_TOKEN?.trim();
const teamId = process.env.VERCEL_ORG_ID?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();

const DOMAINS = [
  "jhonnysurfstore.com",
  "www.jhonnysurfstore.com",
  "jhonnysurfstore.pt",
  "www.jhonnysurfstore.pt",
];

if (!token || !teamId || !projectId) {
  console.error("Missing VERCEL_TOKEN / VERCEL_ORG_ID / VERCEL_PROJECT_ID");
  process.exit(1);
}

async function api(path, init = {}) {
  const url = new URL(`https://api.vercel.com${path}`);
  url.searchParams.set("teamId", teamId);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { ok: response.ok, status: response.status, body };
}

async function ensureDomain(name) {
  const listed = await api(`/v9/projects/${projectId}/domains/${encodeURIComponent(name)}`);
  if (listed.ok) {
    const verified = listed.body?.verified !== false;
    console.log(`ok: ${name} already on project (verified=${verified})`);
    if (!verified) {
      console.log(
        `  → finish DNS: set NS for ${name.replace(/^www\./, "")} to ns1.vercel-dns.com and ns2.vercel-dns.com (same as .com), or add the A/CNAME records Vercel shows for this domain.`
      );
    }
    return { name, status: "exists", verified: listed.body?.verified !== false };
  }

  const created = await api(`/v10/projects/${projectId}/domains`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  if (created.ok || created.status === 409) {
    console.log(`ok: ${name} attached (http ${created.status})`);
    if (created.body?.verified === false || created.body?.verification?.length) {
      console.log(
        `  → DNS not verified yet. Point ${name.replace(/^www\./, "")} nameservers to ns1.vercel-dns.com + ns2.vercel-dns.com, or apply Vercel’s suggested records.`
      );
    }
    return { name, status: "added", verified: created.body?.verified === true };
  }

  console.error(`fail: ${name} http ${created.status}`, JSON.stringify(created.body));
  return { name, status: "error", verified: false, error: created.body };
}

const results = [];
for (const domain of DOMAINS) {
  results.push(await ensureDomain(domain));
}

const failures = results.filter((row) => row.status === "error");
if (failures.length) {
  console.warn(
    "Could not attach (non-fatal):",
    failures.map((row) => row.name).join(", ")
  );
}

const unverified = results.filter((row) => row.verified === false);
if (unverified.length) {
  console.log(
    "Attached but waiting on DNS:",
    unverified.map((row) => row.name).join(", ")
  );
  console.log(
    "Registrar tip after renewing .pt: set nameservers to ns1.vercel-dns.com and ns2.vercel-dns.com (already used by jhonnysurfstore.com)."
  );
}

console.log("ensure-vercel-domains: done");
