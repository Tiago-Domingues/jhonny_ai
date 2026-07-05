import "server-only";

import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "@/lib/ecommerce/db";
import { formatEuro } from "@/lib/ecommerce/money";

function emailFrom() {
  return process.env.EMAIL_FROM || "Jhonny Surf Store <orders@jhonnysurfstore.com>";
}

function jhonnyEmail() {
  return process.env.JHONNY_ORDER_EMAIL || "jhonnysurfstore@gmail.com";
}

function emailProvider() {
  return (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
}

async function sendSmtpEmail(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = (process.env.SMTP_SECURE || "true").toLowerCase() !== "false";

  if (!host || !user || !pass) {
    return {
      status: "SKIPPED" as const,
      providerId: null,
      error: "SMTP_HOST, SMTP_USER, or SMTP_PASSWORD is not configured.",
    };
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  const result = await transport.sendMail({
    from: emailFrom(),
    to,
    subject,
    html,
  });

  return { status: "SENT" as const, providerId: result.messageId, error: null };
}

async function sendResendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { status: "SKIPPED" as const, providerId: null, error: "RESEND_API_KEY is not configured." };
  }

  const resend = new Resend(key);
  const response = await resend.emails.send({
    from: emailFrom(),
    to,
    subject,
    html,
  });

  if (response.error) {
    return { status: "FAILED" as const, providerId: null, error: response.error.message };
  }

  return { status: "SENT" as const, providerId: response.data?.id || null, error: null };
}

async function sendEmail(to: string, subject: string, html: string) {
  if (emailProvider() === "smtp") {
    return sendSmtpEmail(to, subject, html);
  }
  return sendResendEmail(to, subject, html);
}

function orderHtml(order: Awaited<ReturnType<typeof loadOrderForEmail>>, audience: "customer" | "jhonny") {
  if (!order) return "";
  const itemRows = order.items
    .map(
      (item) =>
        `<li>${item.quantity} x ${item.name} - ${formatEuro(item.totalCents)}</li>`
    )
    .join("");
  const pickup =
    order.fulfillmentMethod === "PICKUP_IN_STORE"
      ? "<p><strong>Pickup:</strong> Jhonny Surf Store, Rua de Gaza 16 loja direita, 2775-597 Carcavelos. Wait for pickup confirmation before coming to collect.</p>"
      : "<p><strong>Delivery:</strong> We will confirm shipping details after payment.</p>";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>${audience === "customer" ? "Obrigado pela tua encomenda" : "Nova encomenda Jhonny Surf Store"}</h1>
      <p><strong>Order:</strong> ${order.orderNumber}</p>
      <p><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</p>
      <ul>${itemRows}</ul>
      <p><strong>Total:</strong> ${formatEuro(order.totalCents)}</p>
      ${pickup}
      <p>Where surfers become legends.</p>
    </div>
  `;
}

async function loadOrderForEmail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });
}

async function recordEmailEvent(input: {
  orderId: string;
  userId?: string | null;
  type:
    | "ORDER_RECEIVED_CUSTOMER"
    | "ORDER_RECEIVED_JHONNY"
    | "PAYMENT_PENDING"
    | "PAYMENT_CONFIRMED"
    | "PICKUP_READY"
    | "REVIEW_REQUEST"
    | "ABANDONED_CART"
    | "BROWSE_REMINDER";
  recipientEmail: string;
  subject: string;
  status: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
  providerId?: string | null;
  error?: string | null;
}) {
  return prisma.emailEvent.create({
    data: {
      orderId: input.orderId,
      userId: input.userId || null,
      type: input.type,
      recipientEmail: input.recipientEmail,
      subject: input.subject,
      status: input.status,
      provider: emailProvider(),
      providerId: input.providerId || null,
      error: input.error || null,
      sentAt: input.status === "SENT" ? new Date() : null,
    },
  });
}

export async function sendWelcomeEmail(input: { userId: string; email: string; fullName?: string | null }) {
  const subject = "Welcome to Jhonny Surf Store";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>Welcome to Jhonny Surf Store</h1>
      <p>Hi ${input.fullName || "Legend"},</p>
      <p>Welcome to the Jhonny family. Your account is ready, and you can now save your profile, shop faster, and follow your surf gear orders.</p>
      <p>Where surfers become legends.</p>
    </div>
  `;
  const result = await sendEmail(input.email, subject, html);

  return prisma.emailEvent.create({
    data: {
      userId: input.userId,
      type: "WELCOME_CUSTOMER",
      recipientEmail: input.email,
      subject,
      status: result.status,
      provider: emailProvider(),
      providerId: result.providerId,
      error: result.error,
      sentAt: result.status === "SENT" ? new Date() : null,
    },
  });
}

export async function sendOrderEmails(orderId: string) {
  const order = await loadOrderForEmail(orderId);
  if (!order) throw new Error("Order not found.");

  const customerSubject = `Jhonny Surf Store order ${order.orderNumber}`;
  const customer = await sendEmail(order.customerEmail, customerSubject, orderHtml(order, "customer"));
  await recordEmailEvent({
    orderId,
    userId: order.userId,
    type: "ORDER_RECEIVED_CUSTOMER",
    recipientEmail: order.customerEmail,
    subject: customerSubject,
    status: customer.status,
    providerId: customer.providerId,
    error: customer.error,
  });

  const ownerSubject = `New order ${order.orderNumber}`;
  const owner = await sendEmail(jhonnyEmail(), ownerSubject, orderHtml(order, "jhonny"));
  await recordEmailEvent({
    orderId,
    userId: order.userId,
    type: "ORDER_RECEIVED_JHONNY",
    recipientEmail: jhonnyEmail(),
    subject: ownerSubject,
    status: owner.status,
    providerId: owner.providerId,
    error: owner.error,
  });
}

export async function scheduleReviewRequest(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  return prisma.emailEvent.create({
    data: {
      orderId,
      userId: order.userId,
      type: "REVIEW_REQUEST",
      status: "PENDING",
      recipientEmail: order.customerEmail,
      subject: `How was your Jhonny Surf Store order ${order.orderNumber}?`,
      scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
}
