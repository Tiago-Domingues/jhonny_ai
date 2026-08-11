import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/ecommerce/db";
import type { GoogleUserInfo } from "@/lib/ecommerce/googleOAuth";
import { registerSchema, loginSchema, profileSchema } from "@/lib/ecommerce/schemas";
import { hashPassword, normalizeEmail, randomToken, verifyPassword } from "@/lib/ecommerce/security";

export async function registerCustomer(input: unknown) {
  const data = registerSchema.parse(input);
  const email = normalizeEmail(data.email);

  try {
    return await prisma.user.create({
      data: {
        email,
        username: data.username.trim(),
        passwordHash: await hashPassword(data.password),
        profile: {
          create: {
            fullName: data.fullName.trim(),
            phoneCountryCode: data.phoneCountryCode,
            phone: data.phone || null,
            customerType: data.customerType,
            preferredLanguage: data.preferredLanguage,
            marketingOptIn: data.marketingOptIn,
          },
        },
      },
      include: { profile: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Email or username is already registered.");
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

  if (!user?.passwordHash || !(await verifyPassword(data.password, user.passwordHash))) {
    throw new Error("Invalid login details.");
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
        profile: {
          create: {
            fullName,
            customerType: "SURFER",
            preferredLanguage: "en",
            marketingOptIn: false,
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
      marketingOptIn: data.marketingOptIn,
      odooSyncStatus: "PENDING_SYNC",
    },
  });
}
