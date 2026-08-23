import "server-only";

import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "@/lib/ecommerce/db";
import { formatEuro } from "@/lib/ecommerce/money";
import { OdooClient, hasOdooConfig } from "@/lib/ecommerce/odooClient";
import { fetchOdooInvoicePdf } from "@/lib/ecommerce/odooInvoice";
import { PAID_CUSTOMER_EMAIL_SUBJECT_PREFIX } from "@/lib/ecommerce/emailSubjects";
import { emailAddressOnly, resolveTransactionalFrom, smtpDeliveryStatus } from "@/lib/ecommerce/emailFrom";

export { isPaidCustomerFaturaEmailSubject, PAID_CUSTOMER_EMAIL_SUBJECT_PREFIX } from "@/lib/ecommerce/emailSubjects";
export { resolveTransactionalFrom } from "@/lib/ecommerce/emailFrom";

function emailFrom() {
  return resolveTransactionalFrom({
    emailFrom: process.env.EMAIL_FROM,
    smtpUser: emailProvider() === "smtp" ? process.env.SMTP_USER : null,
  });
}

function jhonnyEmail() {
  return process.env.JHONNY_ORDER_EMAIL || "jhonnysurfstore@gmail.com";
}

function emailProvider() {
  return (process.env.EMAIL_PROVIDER || "smtp").toLowerCase();
}

/** Absolute site origin for email assets (Gmail blocks relative image URLs). */
function publicSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "https://www.jhonnysurfstore.com";
}

function jhonnyToyImageUrl() {
  return `${publicSiteOrigin()}/brand/jhonny-character-cut.png`;
}

type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

type SendResult = {
  status: "SENT" | "FAILED" | "SKIPPED";
  providerId: string | null;
  error: string | null;
};

type SendEmailOptions = {
  attachments?: EmailAttachment[];
  bcc?: string;
};

async function sendSmtpEmail(to: string, subject: string, html: string, options?: SendEmailOptions): Promise<SendResult> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = (process.env.SMTP_SECURE || "true").toLowerCase() !== "false";

  if (!host || !user || !pass) {
    return {
      status: "SKIPPED",
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
      bcc: options?.bcc,
      subject,
      html,
      attachments: options?.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType || "application/pdf",
      })),
    });
    const delivery = smtpDeliveryStatus(result);
    if (!delivery.ok) {
      return {
        status: "FAILED",
        providerId: result.messageId || null,
        error: delivery.error,
      };
    }

    return { status: "SENT", providerId: result.messageId, error: null };
  } catch (error) {
    return {
      status: "FAILED",
      providerId: null,
      error: error instanceof Error ? error.message : "SMTP send failed.",
    };
  }
}

async function sendResendEmail(to: string, subject: string, html: string, options?: SendEmailOptions): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { status: "SKIPPED", providerId: null, error: "RESEND_API_KEY is not configured." };
  }

  try {
    const resend = new Resend(key);
    const response = await resend.emails.send({
      from: emailFrom(),
      to,
      bcc: options?.bcc,
      subject,
      html,
      attachments: options?.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64"),
      })),
    });

    if (response.error) {
      return { status: "FAILED", providerId: null, error: response.error.message };
    }

    return { status: "SENT", providerId: response.data?.id || null, error: null };
  } catch (error) {
    return {
      status: "FAILED",
      providerId: null,
      error: error instanceof Error ? error.message : "Resend send failed.",
    };
  }
}

async function sendEmail(to: string, subject: string, html: string, options?: SendEmailOptions): Promise<SendResult> {
  if (emailProvider() === "smtp") {
    return sendSmtpEmail(to, subject, html, options);
  }
  return sendResendEmail(to, subject, html, options);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paymentInstructionsHtml(order: NonNullable<Awaited<ReturnType<typeof loadOrderForEmail>>>) {
  const payment = order.payments[0];
  if (!payment) return "";

  if (payment.method === "MULTIBANCO") {
    return `
      <div style="margin:16px 0;padding:12px;border:1px solid #ddd;border-radius:8px">
        <p><strong>Pagamento Multibanco</strong></p>
        <p>Entidade: <strong>${escapeHtml(payment.multibancoEntity || "—")}</strong></p>
        <p>Referência: <strong>${escapeHtml(payment.multibancoReference || "—")}</strong></p>
        <p>Valor: <strong>${formatEuro(payment.amountCents)}</strong></p>
      </div>
    `;
  }

  if (payment.method === "MBWAY") {
    return `
      <div style="margin:16px 0;padding:12px;border:1px solid #ddd;border-radius:8px">
        <p><strong>Pagamento MB WAY</strong></p>
        <p>Pedido enviado${payment.mbwayPhone ? ` para <strong>${escapeHtml(payment.mbwayPhone)}</strong>` : ""}.</p>
        <p>Abre a app MB WAY e aprova o pagamento de <strong>${formatEuro(payment.amountCents)}</strong>.</p>
      </div>
    `;
  }

  if (
    payment.method === "KLARNA" ||
    payment.method === "GOOGLE_PAY" ||
    payment.method === "REVOLUT_PAY" ||
    payment.method === "CARD" ||
    payment.method === "APPLE_PAY" ||
    payment.method === "PAYPAL" ||
    payment.method === "PIX"
  ) {
    const label =
      payment.method === "KLARNA"
        ? "Klarna"
        : payment.method === "GOOGLE_PAY"
          ? "Google Pay"
          : payment.method === "REVOLUT_PAY"
            ? "Revolut Pay"
            : payment.method === "CARD"
              ? "Cartão"
              : payment.method === "APPLE_PAY"
                ? "Apple Pay"
                : payment.method === "PIX"
                  ? "Pix"
                  : "PayPal";
    return `
      <div style="margin:16px 0;padding:12px;border:1px solid #ddd;border-radius:8px">
        <p><strong>Pagamento ${escapeHtml(label)}</strong></p>
        <p>Continua na página segura da Stripe para concluir o pagamento.</p>
        <p>Valor: <strong>${formatEuro(payment.amountCents)}</strong></p>
        ${
          payment.providerPaymentUrl
            ? `<p><a href="${escapeHtml(payment.providerPaymentUrl)}">Continuar para o pagamento</a></p>`
            : ""
        }
      </div>
    `;
  }

  return `<p><strong>Método de pagamento:</strong> ${escapeHtml(payment.method)}</p>`;
}

function orderHtml(
  order: Awaited<ReturnType<typeof loadOrderForEmail>>,
  audience: "customer" | "jhonny",
  variant: "received" | "paid" = "received",
  options?: { hasFatura?: boolean }
) {
  if (!order) return "";
  const itemRows = order.items
    .map(
      (item) =>
        `<li>${item.quantity} x ${escapeHtml(item.name)} - ${formatEuro(item.totalCents)}</li>`
    )
    .join("");
  const pickup =
    order.fulfillmentMethod === "PICKUP_IN_STORE"
      ? "<p><strong>Pickup:</strong> Jhonny Surf Store, Rua de Gaza 16 loja direita, 2775-597 Carcavelos. Wait for pickup confirmation before coming to collect.</p>"
      : "<p><strong>Delivery:</strong> We will confirm shipping details after payment.</p>";

  const title =
    variant === "paid"
      ? audience === "customer"
        ? "Pagamento confirmado"
        : "Pagamento recebido"
      : audience === "customer"
        ? "Obrigado pela tua encomenda"
        : "Nova encomenda Jhonny Surf Store";

  const paidNote =
    variant === "paid"
      ? `<p>O pagamento desta encomenda foi confirmado.${order.customerVat ? ` NIF: ${escapeHtml(order.customerVat)}.` : ""}</p>${
          options?.hasFatura
            ? "<p>A fatura-recibo oficial do Odoo (Ponto de Venda) segue em anexo (PDF).</p>"
            : ""
        }`
      : paymentInstructionsHtml(order);

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>${title}</h1>
      <p><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>
      <p><strong>Customer:</strong> ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})</p>
      <ul>${itemRows}</ul>
      <p><strong>Total:</strong> ${formatEuro(order.totalCents)}</p>
      ${paidNote}
      ${pickup}
      <p>Where surfers become legends.</p>
    </div>
  `;
}

async function loadOrderForEmail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
  });
}

async function loadPaidInvoicePdf(order: NonNullable<Awaited<ReturnType<typeof loadOrderForEmail>>>) {
  if (!order.odooInvoiceId || !hasOdooConfig()) return null;
  try {
    const client = new OdooClient();
    const pdf = await fetchOdooInvoicePdf(client, order.odooInvoiceId);
    if (!pdf) return null;
    return {
      filename: `fatura-recibo-${order.orderNumber}.pdf`,
      content: pdf,
      contentType: "application/pdf",
    } satisfies EmailAttachment;
  } catch {
    return null;
  }
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
  const toyUrl = jhonnyToyImageUrl();
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>Welcome to Jhonny Surf Store</h1>
      <p>Hi ${escapeHtml(input.fullName || "Legend")},</p>
      <p>Welcome to the Jhonny family. Your account is ready, and you can now save your profile, shop faster, and follow your surf gear orders.</p>
      <p>Where surfers become legends.</p>
      <p style="margin:28px 0 8px;text-align:left">
        <img
          src="${toyUrl}"
          alt="Jhonny"
          width="120"
          height="182"
          style="display:block;width:120px;height:auto;border:0;outline:none;text-decoration:none"
        />
      </p>
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

export async function sendEmailVerificationEmail(input: {
  userId?: string | null;
  email: string;
  fullName?: string | null;
  verifyUrl: string;
}) {
  const subject = "Jhonny Surf Store — confirma o teu email";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>Confirma o teu email</h1>
      <p>Hi ${escapeHtml(input.fullName || "Legend")},</p>
      <p>Clica no link para confirmares o email e terminares o registo. Depois podes preencher o perfil. Expira em 24 horas.</p>
      <p><a href="${escapeHtml(input.verifyUrl)}">Confirmar email e continuar</a></p>
      <p>Se não pediste esta conta, ignora este email.</p>
    </div>
  `;
  const result = await sendEmail(input.email, subject, html);
  return prisma.emailEvent.create({
    data: {
      userId: input.userId || null,
      type: "EMAIL_VERIFICATION",
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

export async function sendPasswordResetEmail(input: {
  userId: string;
  email: string;
  fullName?: string | null;
  resetUrl: string;
  googleOnly?: boolean;
}) {
  const subject = input.googleOnly
    ? "Jhonny Surf Store — entra com Google"
    : "Jhonny Surf Store — repor password";
  const html = input.googleOnly
    ? `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>Esta conta usa Google</h1>
      <p>Hi ${escapeHtml(input.fullName || "Legend")},</p>
      <p>Esta conta entra com Google. Não precisas de password — usa “Continuar com Google” em <a href="${escapeHtml(input.resetUrl)}">jhonnysurfstore.com/conta</a>.</p>
    </div>
  `
    : `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>Repor password</h1>
      <p>Hi ${escapeHtml(input.fullName || "Legend")},</p>
      <p>Clica no link para escolheres uma password nova. Expira em 1 hora.</p>
      <p><a href="${escapeHtml(input.resetUrl)}">Repor a password</a></p>
      <p>Se não pediste isto, ignora este email.</p>
    </div>
  `;
  const result = await sendEmail(input.email, subject, html);
  return prisma.emailEvent.create({
    data: {
      userId: input.userId,
      type: "PASSWORD_RESET",
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

  try {
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
  } catch (error) {
    await recordEmailEvent({
      orderId,
      userId: order.userId,
      type: "ORDER_RECEIVED_CUSTOMER",
      recipientEmail: order.customerEmail,
      subject: `Jhonny Surf Store order ${order.orderNumber}`,
      status: "FAILED",
      error: error instanceof Error ? error.message : "order_email_failed",
    }).catch(() => null);
  }
}

export async function hasSentPaidFaturaEmail(orderId: string) {
  const sent = await prisma.emailEvent.findFirst({
    where: {
      orderId,
      type: "PAYMENT_CONFIRMED",
      status: "SENT",
      subject: { startsWith: PAID_CUSTOMER_EMAIL_SUBJECT_PREFIX },
    },
    select: { id: true },
  });
  return Boolean(sent);
}

export async function findPaidOrdersMissingFaturaEmail(limit = 20) {
  return prisma.order.findMany({
    where: {
      status: "PAID",
      odooInvoiceId: { not: null },
      NOT: {
        emailEvents: {
          some: {
            type: "PAYMENT_CONFIRMED",
            status: "SENT",
            subject: { startsWith: PAID_CUSTOMER_EMAIL_SUBJECT_PREFIX },
          },
        },
      },
    },
    orderBy: { paidAt: "desc" },
    take: limit,
    select: { id: true, orderNumber: true },
  });
}

export async function findOrderForPaidEmail(orderNumber: string) {
  return prisma.order.findFirst({
    where: { orderNumber },
    select: { id: true, orderNumber: true },
  });
}

function ownerCopyBcc(customerEmail: string): string | undefined {
  const owner = emailAddressOnly(jhonnyEmail());
  const customer = emailAddressOnly(customerEmail);
  if (!owner || owner === customer) return undefined;
  return jhonnyEmail();
}

export async function sendPaymentConfirmedEmails(orderId: string, options?: { force?: boolean }) {
  const order = await loadOrderForEmail(orderId);
  if (!order) return { skipped: true, reason: "order_not_found" };
  if (!options?.force && (await hasSentPaidFaturaEmail(orderId))) {
    return { skipped: true, reason: "already_sent" };
  }
  const invoice = await loadPaidInvoicePdf(order);
  if (!invoice) {
    await recordEmailEvent({
      orderId,
      userId: order.userId,
      type: "PAYMENT_CONFIRMED",
      recipientEmail: order.customerEmail,
      subject: `Pagamento confirmado — ${order.orderNumber}`,
      status: "SKIPPED",
      error: "missing_odoo_fatura_pdf",
    });
    return { skipped: true, reason: "missing_odoo_fatura_pdf" };
  }
  const attachments = [invoice];

  try {
    const customerSubject = `Pagamento confirmado — ${order.orderNumber}`;
    const customer = await sendEmail(
      order.customerEmail,
      customerSubject,
      orderHtml(order, "customer", "paid", { hasFatura: Boolean(invoice) }),
      { attachments, bcc: ownerCopyBcc(order.customerEmail) }
    );
    await recordEmailEvent({
      orderId,
      userId: order.userId,
      type: "PAYMENT_CONFIRMED",
      recipientEmail: order.customerEmail,
      subject: customerSubject,
      status: customer.status,
      providerId: customer.providerId,
      error: customer.error,
    });

    const ownerSubject = `Pagamento recebido — ${order.orderNumber}`;
    const owner = await sendEmail(
      jhonnyEmail(),
      ownerSubject,
      orderHtml(order, "jhonny", "paid", { hasFatura: Boolean(invoice) }),
      { attachments }
    );
    await recordEmailEvent({
      orderId,
      userId: order.userId,
      type: "PAYMENT_CONFIRMED",
      recipientEmail: jhonnyEmail(),
      subject: ownerSubject,
      status: owner.status,
      providerId: owner.providerId,
      error: owner.error,
    });
    const bothSent = customer.status === "SENT" && owner.status === "SENT";
    return {
      skipped: !bothSent,
      reason: bothSent ? "sent" : `customer_${customer.status.toLowerCase()}_owner_${owner.status.toLowerCase()}`,
    };
  } catch (error) {
    await recordEmailEvent({
      orderId,
      userId: order.userId,
      type: "PAYMENT_CONFIRMED",
      recipientEmail: order.customerEmail,
      subject: `Pagamento confirmado — ${order.orderNumber}`,
      status: "FAILED",
      error: error instanceof Error ? error.message : "payment_email_failed",
    }).catch(() => null);
    return { skipped: true, reason: "failed" };
  }
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
