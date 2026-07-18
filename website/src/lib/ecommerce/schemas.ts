import { z } from "zod";

export const customerTypes = [
  "PROFESSIONAL",
  "SURFER",
  "BEGINNER",
  "TOURIST",
  "ERASMUS_STUDENT",
  "SURF_PARENT",
  "LOCAL_CUSTOMER",
  "OTHER",
] as const;

export const genders = [
  "FEMALE",
  "MALE",
  "NON_BINARY",
  "PREFER_NOT_TO_SAY",
  "OTHER",
] as const;

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  phoneCountryCode: z.string().min(2).max(8).default("+351"),
  phone: z.string().max(40).optional().or(z.literal("")),
  customerType: z.enum(customerTypes).default("SURFER"),
  marketingOptIn: z.boolean().default(false),
  preferredLanguage: z.enum(["pt", "en", "zh"]).default("en"),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(3).max(120),
  password: z.string().min(1).max(128),
});

export const profileSchema = z.object({
  fullName: z.string().min(2).max(120),
  phoneCountryCode: z.string().min(2).max(8).default("+351"),
  phone: z.string().max(40).optional().or(z.literal("")),
  birthDate: z.string().date().optional().or(z.literal("")),
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
  marketingOptIn: z.boolean().default(false),
});

export const cartAddSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
});

export const cartUpdateSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(0).max(20),
});

export const checkoutSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  phoneCountryCode: z.string().min(2).max(8).default("+351"),
  phone: z.string().min(6).max(40),
  fulfillmentMethod: z.enum(["PICKUP_IN_STORE", "SHIP_TO_ADDRESS"]),
  paymentMethod: z.enum(["MBWAY", "MULTIBANCO", "PAYPAL", "KLARNA", "CARD", "MANUAL"]),
  mbwayPhone: z.string().max(40).optional().or(z.literal("")),
  marketingOptIn: z.boolean().default(false),
  notes: z.string().max(1000).optional().or(z.literal("")),
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
  couponCode: z.string().max(40).optional().or(z.literal("")),
});

export const couponValidationSchema = z.object({
  code: z.string().min(2).max(40),
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
