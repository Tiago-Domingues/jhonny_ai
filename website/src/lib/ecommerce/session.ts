import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/ecommerce/db";

const SESSION_COOKIE = "jss_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET || "dev-only-change-me-before-production";
  return new TextEncoder().encode(secret);
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

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      fullName: user.profile?.fullName,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
}
