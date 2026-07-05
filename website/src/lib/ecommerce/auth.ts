import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/ecommerce/db";
import { registerSchema, loginSchema, profileSchema } from "@/lib/ecommerce/schemas";
import { hashPassword, normalizeEmail, verifyPassword } from "@/lib/ecommerce/security";

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

  if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
    throw new Error("Invalid login details.");
  }

  return user;
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
