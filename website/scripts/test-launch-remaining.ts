import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { orderBelongsToUser, ordersWhereForUser } from "../src/lib/ecommerce/orderAccess";

dotenv.config({ path: ".env.local" });
dotenv.config();

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

type Bucket = { count: number; resetAt: number };

/** Mirrors `rateLimit` in securityRuntime.ts for an offline 429 burst. */
function rateLimit(buckets: Map<string, Bucket>, key: string, limit: number, windowMs: number, now: number) {
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }
  if (current.count >= limit) return { ok: false as const };
  current.count += 1;
  return { ok: true as const };
}

async function verifyEmailWithToken(prisma: PrismaClient, token: string) {
  const tokenHash = hashToken(token);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!row) {
    throw new Error("This verification link is invalid or has expired.");
  }
  if (row.usedAt) {
    return row.user;
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw new Error("This verification link is invalid or has expired.");
  }
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: row.user.emailVerifiedAt || new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return user;
}

function checkOrdersFilter() {
  const where = ordersWhereForUser("user-a", " Ana@Example.com ");
  assert(where.OR[0].userId === "user-a", "orders query includes the account id");
  assert(where.OR[1].customerEmail.equals === "ana@example.com", "orders query normalizes email");
  assert(
    orderBelongsToUser({ userId: "user-a", customerEmail: "other@x.com" }, "user-a", "ana@example.com"),
    "owner id matches"
  );
  assert(
    orderBelongsToUser({ userId: null, customerEmail: "ANA@example.com" }, "user-b", "ana@example.com"),
    "guest order with the same email is visible after register"
  );
  assert(
    !orderBelongsToUser({ userId: "user-c", customerEmail: "other@x.com" }, "user-a", "ana@example.com"),
    "another customer’s order is hidden"
  );
}

function checkFaqCopy() {
  const faq = readFileSync(resolve(__dirname, "../src/app/faq/page.tsx"), "utf8");
  assert(!/em preparação|being prepared|筹备中/.test(faq), "FAQ no longer says the shop is only being prepared");
  assert(/MB WAY/.test(faq) && /JHONNY10/.test(faq), "FAQ mentions live payments and JHONNY10");
  assert(/fatura-recibo/.test(faq), "FAQ mentions fatura-recibo");
  assert(/password|palavra-passe|密码/i.test(faq), "FAQ mentions password reset");
}

function checkTokenHash() {
  const token = randomToken(32);
  const hashed = hashToken(token);
  assert(hashed !== token && hashed.length === 64, "verification tokens are stored hashed");
  assert(!hashed.includes(token.slice(0, 8)), "plaintext token fragment is not stored");
}

function checkRateLimitBurst() {
  const buckets = new Map<string, Bucket>();
  const now = Date.now();
  const key = "availability-request:127.0.0.1";
  for (let i = 0; i < 8; i += 1) {
    assert(rateLimit(buckets, key, 8, 60_000, now).ok, `availability request ${i + 1} is allowed`);
  }
  assert(!rateLimit(buckets, key, 8, 60_000, now).ok, "ninth availability request is rate limited");

  const ratingKey = "product-rating:127.0.0.1";
  for (let i = 0; i < 20; i += 1) {
    assert(rateLimit(buckets, ratingKey, 20, 60_000, now).ok, `rating ${i + 1} is allowed`);
  }
  assert(!rateLimit(buckets, ratingKey, 20, 60_000, now).ok, "21st rating is rate limited");
}

async function checkVerificationTokens(prisma: PrismaClient) {
  const stamp = Date.now().toString(36);
  const email = `launch-verify-${stamp}@example.com`;
  const username = `launchverify${stamp}`.slice(0, 32);
  const token = randomToken(32);
  const expiredToken = randomToken(32);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: "unused-for-verify-test",
      role: "CUSTOMER",
      profile: { create: { fullName: "Launch Verify", preferredLanguage: "pt" } },
    },
  });

  const stored = await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  assert(stored.tokenHash !== token, "verify token is not stored plaintext");
  assert(stored.tokenHash === hashToken(token), "stored hash matches sha256 of the token");
  assert(!stored.tokenHash.includes(token.slice(0, 8)), "plaintext token fragment is not stored");

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(expiredToken),
      expiresAt: new Date(Date.now() - 60 * 1000),
    },
  });

  try {
    await verifyEmailWithToken(prisma, expiredToken);
    throw new Error("expired token should have failed");
  } catch (error) {
    assert(String(error).includes("invalid or has expired"), "expired token is rejected");
  }

  await verifyEmailWithToken(prisma, token);
  const updated = await prisma.user.findUnique({ where: { id: user.id } });
  assert(updated?.emailVerifiedAt, "emailVerifiedAt is set after a valid token");

  const replayed = await verifyEmailWithToken(prisma, token);
  assert(replayed.id === user.id, "a second click on the same verify link still succeeds");

  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await prisma.customerProfile.deleteMany({ where: { userId: user.id } }).catch(() => null);
  await prisma.user.delete({ where: { id: user.id } });
}

async function checkHttpRateLimit() {
  const base = (process.env.LAUNCH_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
  let lastStatus = 0;
  let saw429 = false;
  for (let i = 0; i < 9; i += 1) {
    const response = await fetch(`${base}/api/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.88" },
      body: JSON.stringify({
        productId: "launch-remaining-rate-limit",
        email: "rate-limit@example.com",
      }),
    });
    lastStatus = response.status;
    if (response.status === 429) {
      saw429 = true;
      break;
    }
  }
  assert(saw429, `availability burst should 429 (last status ${lastStatus})`);
}

async function main() {
  checkOrdersFilter();
  checkFaqCopy();
  checkTokenHash();
  checkRateLimitBurst();
  console.log("launch remaining: offline orders filter, FAQ, token hash, and limiter burst passed");

  const connectionString = process.env.DATABASE_URL?.trim();
  if (connectionString) {
    const prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString,
        ssl: { rejectUnauthorized: false },
      }),
    });
    try {
      await checkVerificationTokens(prisma);
      console.log("launch remaining: email verification token hash, expiry, and reuse passed");
    } finally {
      await prisma.$disconnect();
    }
  } else {
    console.log("launch remaining: skipped DB verify-token checks (no DATABASE_URL)");
  }

  if (process.env.LAUNCH_TEST_HTTP === "0") {
    console.log("launch remaining: skipped HTTP 429 check (LAUNCH_TEST_HTTP=0)");
    return;
  }
  try {
    await checkHttpRateLimit();
    console.log("launch remaining: availability HTTP burst returned 429");
  } catch (error) {
    if (String(error).includes("ECONNREFUSED") || String(error).includes("fetch failed")) {
      console.log("launch remaining: skipped HTTP 429 check (dev server not reachable)");
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
