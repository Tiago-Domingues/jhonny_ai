import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/ecommerce/db";
import type { GoogleUserInfo } from "@/lib/ecommerce/googleOAuth";
import {
  isEmailShapedUsername,
  loginSchema,
  pendingRegisterSchema,
  profileSchema,
  registerSchema,
  signupUsernameCandidate,
} from "@/lib/ecommerce/schemas";
import { normalizeNif } from "@/lib/ecommerce/nif";
import { hashPassword, normalizeEmail, randomToken, verifyPassword } from "@/lib/ecommerce/security";
import { ensureAdminRoleForEmail, isAdminEmail } from "@/lib/ecommerce/admin";

export function toPublicAuthUser<
  T extends {
    id: string;
    email: string;
    username: string;
    emailVerifiedAt: Date | null;
    role?: "CUSTOMER" | "ADMIN";
    profile?: { fullName?: string | null } | null;
  },
>(user: T) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.profile?.fullName,
    emailVerifiedAt: user.emailVerifiedAt,
    ...(user.role ? { role: user.role } : {}),
  };
}

async function allocateUniqueSignupUsername(base: string) {
  const root = base.slice(0, 32);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = attempt === 0 ? "" : String(attempt + 1);
    const candidate = `${root.slice(0, 40 - suffix.length)}${suffix}`;
    const [user, pending] = await Promise.all([
      prisma.user.findUnique({ where: { username: candidate }, select: { id: true } }),
      prisma.pendingRegistration.findFirst({ where: { username: candidate }, select: { id: true } }),
    ]);
    if (!user && !pending) return candidate;
  }
  const stamp = Date.now().toString(36);
  return `${root.slice(0, Math.max(3, 40 - stamp.length))}${stamp}`.slice(0, 40);
}

function prepareSignupInput(input: unknown) {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const rawUsername = typeof source.username === "string" ? source.username : "";
  return {
    prepared: {
      ...source,
      username: isEmailShapedUsername(rawUsername) ? signupUsernameCandidate(rawUsername) : rawUsername.trim(),
    },
    fromEmail: isEmailShapedUsername(rawUsername),
  };
}

export async function registerCredentialsCustomer(input: unknown) {
  const { prepared, fromEmail } = prepareSignupInput(input);
  const data = pendingRegisterSchema.parse(prepared);
  const email = normalizeEmail(data.email);
  const username = fromEmail ? await allocateUniqueSignupUsername(data.username.trim()) : data.username.trim();

  if (!fromEmail) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (existingUser) {
      throw new Error("Este email ou username já está registado.");
    }

    const usernameHeld = await prisma.pendingRegistration.findFirst({
      where: { username, NOT: { email } },
      select: { id: true },
    });
    if (usernameHeld) {
      throw new Error("Este email ou username já está registado.");
    }
  } else {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      throw new Error("Este email ou username já está registado.");
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          username,
          passwordHash: await hashPassword(data.password),
          emailVerifiedAt: new Date(),
          role: isAdminEmail(email) ? "ADMIN" : "CUSTOMER",
          profile: {
            create: {
              fullName: username,
              marketingOptIn: data.marketingOptIn,
            },
          },
        },
        include: { profile: true },
      });
      await tx.pendingRegistration.deleteMany({ where: { email } });
      return created;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Este email ou username já está registado.");
    }
    throw error;
  }
}

export async function registerCustomer(input: unknown) {
  const { prepared } = prepareSignupInput(input);
  const data = registerSchema.parse(prepared);
  const email = normalizeEmail(data.email);

  try {
    return await prisma.user.create({
      data: {
        email,
        username: data.username.trim(),
        passwordHash: await hashPassword(data.password),
        role: isAdminEmail(email) ? "ADMIN" : "CUSTOMER",
        profile: {
          create: {
            fullName: data.fullName.trim(),
            phoneCountryCode: data.phoneCountryCode,
            phone: data.phone || null,
            customerType: data.customerType,
            preferredLanguage: data.preferredLanguage,
            birthDate: new Date(data.birthDate),
            marketingOptIn: data.marketingOptIn,
          },
        },
      },
      include: { profile: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Este email ou username já está registado.");
    }
    throw error;
  }
}

export async function loginCustomer(input: unknown) {
  const data = loginSchema.parse(input);
  const emailOrUsername = data.emailOrUsername.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailOrUsername }, { username: data.emailOrUsername.trim() }],
    },
    include: { profile: true },
  });

  if (!user) {
    throw new Error("Email, username ou password inválidos.");
  }
  if (!user.passwordHash) {
    throw new Error("Esta conta entra com Google. Usa Continuar com Google.");
  }
  if (!(await verifyPassword(data.password, user.passwordHash))) {
    throw new Error("Email, username ou password inválidos.");
  }

  if (isAdminEmail(user.email)) {
    await ensureAdminRoleForEmail(user.id, user.email).catch((error) => {
      console.error("admin_promote_failed", error instanceof Error ? error.message : error);
    });
    user.role = "ADMIN";
  }

  return user;
}

function sanitizeUsernameBase(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 24);
  return cleaned || "googleuser";
}

async function allocateUniqueUsername(preferred: string) {
  const base = sanitizeUsernameBase(preferred);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${randomToken(3).slice(0, 6)}`;
    const existing = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  return `${base}${Date.now().toString(36)}`;
}

/** Find-or-create by Google `sub`, auto-link when email already exists. */
export async function upsertGoogleCustomer(info: GoogleUserInfo): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getProfile>>>;
  created: boolean;
}> {
  const email = normalizeEmail(info.email);
  if (info.email_verified === false) {
    throw new Error("Google email is not verified.");
  }

  const bySub = await prisma.user.findUnique({
    where: { googleSub: info.sub },
    include: { profile: true },
  });
  if (bySub) {
    if (bySub.email !== email) {
      // Keep local email as source of truth if Google email changed; still refresh verification stamp.
      await prisma.user.update({
        where: { id: bySub.id },
        data: { emailVerifiedAt: bySub.emailVerifiedAt ?? new Date() },
      });
    } else if (!bySub.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: bySub.id },
        data: { emailVerifiedAt: new Date() },
      });
    }
    await ensureAdminRoleForEmail(bySub.id, bySub.email);
    const refreshed = await getProfile(bySub.id);
    if (!refreshed) throw new Error("Could not load Google account.");
    return { user: refreshed, created: false };
  }

  const byEmail = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });
  if (byEmail) {
    if (byEmail.googleSub && byEmail.googleSub !== info.sub) {
      throw new Error("This email is already linked to a different Google account.");
    }
    const linked = await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleSub: info.sub,
        emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
        role: isAdminEmail(email) ? "ADMIN" : byEmail.role,
      },
      include: { profile: true },
    });
    return { user: linked, created: false };
  }

  const fullName = (info.name || [info.given_name, info.family_name].filter(Boolean).join(" ") || email.split("@")[0]).trim();
  const username = await allocateUniqueUsername(email.split("@")[0] || "googleuser");

  try {
    const created = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: null,
        googleSub: info.sub,
        emailVerifiedAt: new Date(),
        role: isAdminEmail(email) ? "ADMIN" : "CUSTOMER",
        profile: {
          create: {
            fullName,
            customerType: "SURFER",
            preferredLanguage: "en",
            marketingOptIn: true,
          },
        },
      },
      include: { profile: true },
    });
    return { user: created, created: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Could not create Google account (email or username conflict).");
    }
    throw error;
  }
}

export async function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
}

export async function updateProfile(userId: string, input: unknown) {
  const data = profileSchema.parse(input);
  return prisma.customerProfile.upsert({
    where: { userId },
    update: {
      fullName: data.fullName.trim(),
      phoneCountryCode: data.phoneCountryCode,
      phone: data.phone || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      gender: data.gender || null,
      customerType: data.customerType,
      preferredLanguage: data.preferredLanguage,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      postalCode: data.postalCode || null,
      city: data.city || null,
      country: data.country,
      billingSameAsShipping: data.billingSameAsShipping,
      billingAddressLine1: data.billingSameAsShipping ? data.addressLine1 || null : data.billingAddressLine1 || null,
      billingAddressLine2: data.billingSameAsShipping ? data.addressLine2 || null : data.billingAddressLine2 || null,
      billingPostalCode: data.billingSameAsShipping ? data.postalCode || null : data.billingPostalCode || null,
      billingCity: data.billingSameAsShipping ? data.city || null : data.billingCity || null,
      billingCountry: data.billingSameAsShipping ? data.country : data.billingCountry,
      nif: normalizeNif(data.nif) || null,
      marketingOptIn: data.marketingOptIn,
      odooSyncStatus: "PENDING_SYNC",
    },
    create: {
      userId,
      fullName: data.fullName.trim(),
      phoneCountryCode: data.phoneCountryCode,
      phone: data.phone || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      gender: data.gender || null,
      customerType: data.customerType,
      preferredLanguage: data.preferredLanguage,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      postalCode: data.postalCode || null,
      city: data.city || null,
      country: data.country,
      billingSameAsShipping: data.billingSameAsShipping,
      billingAddressLine1: data.billingSameAsShipping ? data.addressLine1 || null : data.billingAddressLine1 || null,
      billingAddressLine2: data.billingSameAsShipping ? data.addressLine2 || null : data.billingAddressLine2 || null,
      billingPostalCode: data.billingSameAsShipping ? data.postalCode || null : data.billingPostalCode || null,
      billingCity: data.billingSameAsShipping ? data.city || null : data.billingCity || null,
      billingCountry: data.billingSameAsShipping ? data.country : data.billingCountry,
      nif: normalizeNif(data.nif) || null,
      marketingOptIn: data.marketingOptIn,
      odooSyncStatus: "PENDING_SYNC",
    },
  });
}
