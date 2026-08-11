import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/ecommerce/db";
import { ensureAdminRoleForEmail } from "@/lib/ecommerce/admin";
import { isProductionRuntime } from "@/lib/ecommerce/securityRuntime";

const SESSION_COOKIE = "jss_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const DEV_DEFAULT_SECRET = "dev-only-change-me-before-production";

export function assertSessionSecretConfigured() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!isProductionRuntime()) {
    return secret || DEV_DEFAULT_SECRET;
  }
  if (!secret || secret === DEV_DEFAULT_SECRET || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too weak for production (need a unique secret, min 32 chars)."
    );
  }
  return secret;
}

function sessionSecret() {
  return new TextEncoder().encode(assertSessionSecretConfigured());
}

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  role: "CUSTOMER" | "ADMIN";
  fullName?: string;
};

export async function createSessionToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(sessionSecret());
}

export async function readSessionUser(): Promise<SessionUser | null> {
  // Fail closed in production if session crypto is misconfigured.
  assertSessionSecretConfigured();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const userId = typeof payload.userId === "string" ? payload.userId : null;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) return null;

    await ensureAdminRoleForEmail(user.id, user.email);
    const effectiveRole =
      user.role === "ADMIN"
        ? "ADMIN"
        : (
            await prisma.user.findUnique({
              where: { id: user.id },
              select: { role: true },
            })
          )?.role || user.role;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: effectiveRole,
      fullName: user.profile?.fullName,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("SESSION_SECRET")) {
      throw error;
    }
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionRuntime(),
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
}
