import "server-only";

import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "@/lib/ecommerce/db";
import { formatEuro } from "@/lib/ecommerce/money";
import { hasOdooConfig, OdooClient } from "@/lib/ecommerce/odooClient";
import { escapeHtml } from "@/lib/ecommerce/security";

type SendResult = {
  status: "SENT" | "FAILED" | "SKIPPED";
  provider: string;
  providerId: string | null;
  error: string | null;
};

function emailFrom() {
  return process.env.EMAIL_FROM || "Jhonny Surf Store <orders@jhonnysurfstore.com>";
}

function jhonnyEmail() {
  return process.env.JHONNY_ORDER_EMAIL || "jhonnysurfstore@gmail.com";
}

function emailProvider() {
  return (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
}

async function sendSmtpEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = (process.env.SMTP_SECURE || "true").toLowerCase() !== "false";

  if (!host || !user || !pass) {
    return {
      status: "SKIPPED",
      provider: "smtp",
      providerId: null,
      error: "SMTP_HOST, SMTP_USER, or SMTP_PASSWORD is not configured.",
    };
  }

  try {
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

    return { status: "SENT", provider: "smtp", providerId: result.messageId, error: null };
  } catch (error) {
    return {
      status: "FAILED",
      provider: "smtp",
      providerId: null,
      error: error instanceof Error ? error.message : "SMTP send failed.",
    };
  }
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      status: "SKIPPED",
      provider: "resend",
      providerId: null,
      error: "RESEND_API_KEY is not configured.",
    };
  }

  try {
    const resend = new Resend(key);
    const response = await resend.emails.send({
      from: emailFrom(),
      to,
      subject,
      html,
    });

    if (response.error) {
      return { status: "FAILED", provider: "resend", providerId: null, error: response.error.message };
    }

    return { status: "SENT", provider: "resend", providerId: response.data?.id || null, error: null };
  } catch (error) {
    return {
      status: "FAILED",
      provider: "resend",
      providerId: null,
      error: error instanceof Error ? error.message : "Resend send failed.",
    };
  }
}

/** Fallback when SMTP/Resend are not configured — uses Odoo's outgoing mail server. */
async function sendOdooEmail(to: string, subject: string, html: string): Promise<SendResult> {
  if (!hasOdooConfig()) {
    return {
      status: "SKIPPED",
      provider: "odoo",
      providerId: null,
      error: "Odoo is not configured for email fallback.",
    };
  }

  try {
    const client = new OdooClient();
    await client.authenticate();
    const mailId = await client.executeKw("mail.mail", "create", [
      {
        subject,
        body_html: html,
        email_to: to,
        email_from:
          (process.env.EMAIL_FROM || "").replace(/^.*<([^>]+)>.*$/, "$1").trim() ||
          process.env.JHONNY_ORDER_EMAIL ||
          "jhonnysurfstore@gmail.com",
        auto_delete: true,
      },
    ]);
    const id = typeof mailId === "number" ? mailId : Number(mailId);
    if (!id) {
      return { status: "FAILED", provider: "odoo", providerId: null, error: "Odoo mail.mail create returned no id." };
    }
    await client.executeKw("mail.mail", "send", [[id]]);
    return { status: "SENT", provider: "odoo", providerId: String(id), error: null };
  } catch (error) {
    return {
      status: "FAILED",
      provider: "odoo",
      providerId: null,
      error: error instanceof Error ? error.message : "Odoo email send failed.",
    };
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const provider = emailProvider();
  let result: SendResult;
  if (provider === "smtp") {
    result = await sendSmtpEmail(to, subject, html);
  } else if (provider === "odoo") {
    result = await sendOdooEmail(to, subject, html);
  } else {
    result = await sendResendEmail(to, subject, html);
  }

  if (result.status === "SKIPPED" && provider !== "odoo") {
    const fallback = await sendOdooEmail(to, subject, html);
    if (fallback.status !== "SKIPPED") return fallback;
  }

  return result;
}

function orderHtml(order: Awaited<ReturnType<typeof loadOrderForEmail>>, audience: "customer" | "jhonny") {
  if (!order) return "";
  const itemRows = order.items
    .map(
      (item) =>
        `<li>${escapeHtml(item.quantity)} x ${escapeHtml(item.name)} - ${escapeHtml(formatEuro(item.totalCents))}</li>`
    )
    .join("");
  const pickup =
    order.fulfillmentMethod === "PICKUP_IN_STORE"
      ? "<p><strong>Pickup:</strong> Jhonny Surf Store, Rua de Gaza 16 Lj direita, 2775-597 Carcavelos. Wait for pickup confirmation before coming to collect.</p>"
      : "<p><strong>Delivery:</strong> We will confirm shipping details after payment.</p>";

  const notes = order.notes?.trim()
    ? `<p><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>${audience === "customer" ? "Obrigado pela tua encomenda" : "Nova encomenda Jhonny Surf Store"}</h1>
      <p><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>
      <p><strong>Customer:</strong> ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})</p>
      <ul>${itemRows}</ul>
      <p><strong>Total:</strong> ${escapeHtml(formatEuro(order.totalCents))}</p>
      ${pickup}
      ${notes}
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
  provider?: string | null;
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
      provider: input.provider || emailProvider(),
      providerId: input.providerId || null,
      error: input.error || null,
      sentAt: input.status === "SENT" ? new Date() : null,
    },
  });
}

export async function sendWelcomeEmail(input: { userId: string; email: string; fullName?: string | null }) {
  const subject = "Welcome to the Jhonny family";
  const safeName = escapeHtml(input.fullName || "Legend");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1 style="margin-bottom:8px">Welcome to the Jhonny family</h1>
      <p>Hi ${safeName},</p>
      <p>Your Jhonny Surf Store account is ready. Save your profile, shop faster, and keep track of your gear orders — we're glad you're here.</p>
      <p>See you in the water (or at the shop in Carcavelos).</p>
      <p style="margin-top:24px"><strong>Where surfers become legends.</strong><br/>Jhonny Surf Store</p>
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
      provider: result.provider,
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
    provider: customer.provider,
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
    provider: owner.provider,
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
