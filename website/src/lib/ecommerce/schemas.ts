import { z } from "zod";
import { isValidOptionalNif } from "@/lib/ecommerce/nif";
import { isValidIsoDate } from "@/lib/ecommerce/birthDate";

const birthDateSchema = z.string().refine(isValidIsoDate, "Invalid birth date.");

export const customerTypes = [
  "PROFESSIONAL",
  "SURFER",
  "BEGINNER",
  "TOURIST",
  "ERASMUS_STUDENT",
  "SURF_PARENT",
  "LOCAL_CUSTOMER",
  "OTHER",
  "BODYBOARDER",
  "LONGBOARDER",
] as const;

export const genders = [
  "FEMALE",
  "MALE",
  "NON_BINARY",
  "PREFER_NOT_TO_SAY",
  "OTHER",
] as const;

export const USERNAME_RULE = /^[a-zA-Z0-9_.-]{3,40}$/;

export const USERNAME_RULE_MESSAGE =
  "O username só pode ter letras, números, ponto, _ e -. Usa entre 3 e 40 caracteres.";

export const PASSWORD_RULE_MESSAGE = "A password precisa de pelo menos 8 caracteres.";

export const EMAIL_RULE_MESSAGE = "Este email não parece válido.";

/** Turn an email typed into the username box into the part before @. */
export function signupUsernameCandidate(raw: string) {
  const trimmed = String(raw || "").trim();
  if (!trimmed.includes("@")) return trimmed;
  const local = trimmed.slice(0, trimmed.lastIndexOf("@"));
  let cleaned = local.replace(/[^a-zA-Z0-9_.-]+/g, "").replace(/^[._-]+|[._-]+$/g, "").slice(0, 32);
  if (cleaned.length < 3) {
    cleaned = `${cleaned}surfer`.replace(/^[^a-zA-Z0-9]+/, "").slice(0, 32);
  }
  if (!USERNAME_RULE.test(cleaned)) return "surfer";
  return cleaned;
}

export function isEmailShapedUsername(raw: string) {
  return String(raw || "").trim().includes("@");
}

const signupUsernameSchema = z
  .string()
  .trim()
  .min(3, USERNAME_RULE_MESSAGE)
  .max(40, USERNAME_RULE_MESSAGE)
  .regex(/^[a-zA-Z0-9_.-]+$/, USERNAME_RULE_MESSAGE);

const signupPasswordSchema = z.string().min(8, PASSWORD_RULE_MESSAGE).max(128, PASSWORD_RULE_MESSAGE);

const signupEmailSchema = z.string().email(EMAIL_RULE_MESSAGE);

export const registerSchema = z.object({
  email: signupEmailSchema,
  username: signupUsernameSchema,
  password: signupPasswordSchema,
  fullName: z.string().min(2).max(120),
  phoneCountryCode: z.string().min(2).max(8).default("+351"),
  phone: z.string().max(40).optional().or(z.literal("")),
  customerType: z.enum(customerTypes).default("SURFER"),
  marketingOptIn: z.boolean().default(true),
  preferredLanguage: z.enum(["pt", "en", "zh"]).default("en"),
  birthDate: birthDateSchema,
});

/** First step of signup: credentials only. Profile is filled after the account exists. */
export const pendingRegisterSchema = z.object({
  email: signupEmailSchema,
  username: signupUsernameSchema,
  password: signupPasswordSchema,
  marketingOptIn: z.boolean().default(true),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(3).max(120),
  password: z.string().min(1).max(128),
});

export const profileSchema = z.object({
  fullName: z.string().min(2).max(120),
  phoneCountryCode: z.string().min(2).max(8).default("+351"),
  phone: z.string().min(6).max(40),
  birthDate: z.union([birthDateSchema, z.literal("")]).optional(),
  gender: z.enum(genders).optional().or(z.literal("")),
  customerType: z.enum(customerTypes),
  preferredLanguage: z.enum(["pt", "en", "zh"]).default("en"),
  addressLine1: z.string().max(160).optional().or(z.literal("")),
  addressLine2: z.string().max(160).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  country: z.string().length(2).default("PT"),
  billingSameAsShipping: z.boolean().default(true),
  billingAddressLine1: z.string().max(160).optional().or(z.literal("")),
  billingAddressLine2: z.string().max(160).optional().or(z.literal("")),
  billingPostalCode: z.string().max(20).optional().or(z.literal("")),
  billingCity: z.string().max(80).optional().or(z.literal("")),
  billingCountry: z.string().length(2).default("PT"),
  nif: z.string().max(20).optional().or(z.literal("")),
  marketingOptIn: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (!isValidOptionalNif(data.nif)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nif"], message: "Invalid NIF / VAT." });
  }
  if (data.phone.replace(/\D/g, "").length < 6) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Phone is required." });
  }
});

export const cartAddSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
});

export const cartUpdateSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(0).max(20),
});

const countryCode = z
  .string()
  .trim()
  .transform((value) => (value ? value.toUpperCase() : "PT"))
  .refine((value) => /^[A-Z]{2}$/.test(value), "Country must be a 2-letter code.");

function requireTrimmed(
  ctx: z.RefinementCtx,
  field: string,
  value: unknown,
  min: number,
  message: string
) {
  if (String(value || "").trim().length < min) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
  }
}

export const checkoutSchema = z
  .object({
    email: z.string().email(),
    fullName: z.string().min(2).max(120),
    phoneCountryCode: z.string().min(2).max(8).default("+351"),
    phone: z.string().min(6).max(40),
    fulfillmentMethod: z.enum(["PICKUP_IN_STORE", "SHIP_TO_ADDRESS"]),
    paymentMethod: z.enum([
      "MBWAY",
      "MULTIBANCO",
      "PAYPAL",
      "KLARNA",
      "CARD",
      "MANUAL",
      "PAYSHOP",
      "GOOGLE_PAY",
      "APPLE_PAY",
      "REVOLUT_PAY",
      "PIX",
    ]),
    mbwayPhone: z.string().max(40).optional().or(z.literal("")),
    marketingOptIn: z.boolean().default(false),
    notes: z.string().max(1000).optional().or(z.literal("")),
    addressLine1: z.string().max(160).optional().or(z.literal("")),
    addressLine2: z.string().max(160).optional().or(z.literal("")),
    postalCode: z.string().max(20).optional().or(z.literal("")),
    city: z.string().max(80).optional().or(z.literal("")),
    country: countryCode.default("PT"),
    billingSameAsShipping: z.boolean().default(true),
    billingAddressLine1: z.string().max(160).optional().or(z.literal("")),
    billingAddressLine2: z.string().max(160).optional().or(z.literal("")),
    billingPostalCode: z.string().max(20).optional().or(z.literal("")),
    billingCity: z.string().max(80).optional().or(z.literal("")),
    billingCountry: countryCode.default("PT"),
    couponCode: z.string().max(80).optional().or(z.literal("")),
    returnOrigin: z.string().url().max(200).optional().or(z.literal("")),
    nif: z.string().max(20).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentMethod === "SHIP_TO_ADDRESS") {
      requireTrimmed(ctx, "addressLine1", data.addressLine1, 3, "Morada is required for delivery.");
      requireTrimmed(ctx, "postalCode", data.postalCode, 3, "Postal code is required for delivery.");
      requireTrimmed(ctx, "city", data.city, 2, "City is required for delivery.");
    }
    if (!data.billingSameAsShipping) {
      requireTrimmed(ctx, "billingAddressLine1", data.billingAddressLine1, 3, "Billing address is required.");
      requireTrimmed(ctx, "billingPostalCode", data.billingPostalCode, 3, "Billing postal code is required.");
      requireTrimmed(ctx, "billingCity", data.billingCity, 2, "Billing city is required.");
    }
    if (!isValidOptionalNif(data.nif)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nif"], message: "Invalid NIF / VAT." });
    }
  });

export const couponValidationSchema = z.object({
  code: z.string().min(2).max(80),
});

export const consentSchema = z.object({
  decisions: z.object({
    required: z.literal(true),
    analytics: z.boolean(),
    personalization: z.boolean(),
    marketing: z.boolean(),
  }),
  source: z.string().max(80).default("cookie_banner"),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PAID",
    "PREPARING",
    "READY_FOR_PICKUP",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
});
