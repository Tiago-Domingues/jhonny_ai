import "server-only";

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

export function integrationStatus() {
  const emailProvider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();

  return {
    database: {
      configured: hasValue(process.env.DATABASE_URL),
      provider: process.env.DATABASE_URL?.startsWith("file:") ? "sqlite/libsql" : "external",
    },
    odoo: {
      configured:
        hasValue(process.env.ODOO_URL) &&
        hasValue(process.env.ODOO_DB) &&
        hasValue(process.env.ODOO_USERNAME) &&
        hasValue(process.env.ODOO_API_KEY),
      liveCatalog: process.env.ODOO_LIVE_CATALOG === "true",
      autoConfirmSaleOrder: process.env.ODOO_AUTO_CONFIRM_SALE_ORDER === "true",
      createInvoiceAfterPayment: process.env.ODOO_CREATE_INVOICE_AFTER_PAYMENT === "true",
      autoValidateDelivery: process.env.ODOO_AUTO_VALIDATE_DELIVERY === "true",
    },
    email: {
      provider: emailProvider,
      configured:
        emailProvider === "smtp"
          ? hasValue(process.env.SMTP_HOST) &&
            hasValue(process.env.SMTP_USER) &&
            hasValue(process.env.SMTP_PASSWORD)
          : hasValue(process.env.RESEND_API_KEY),
      gmailReady:
        emailProvider === "smtp" &&
        process.env.SMTP_HOST === "smtp.gmail.com" &&
        hasValue(process.env.SMTP_USER) &&
        hasValue(process.env.SMTP_PASSWORD),
    },
    ifthenpay: {
      mbwayConfigured: hasValue(process.env.IFTHENPAY_MBWAY_KEY),
      multibancoConfigured: hasValue(process.env.IFTHENPAY_MB_KEY),
      callbackConfigured:
        hasValue(process.env.IFTHENPAY_CALLBACK_URL) &&
        hasValue(process.env.IFTHENPAY_CALLBACK_SECRET),
    },
    paypal: {
      configured:
        hasValue(process.env.PAYPAL_CLIENT_ID) &&
        hasValue(process.env.PAYPAL_CLIENT_SECRET),
      webhookConfigured: hasValue(process.env.PAYPAL_WEBHOOK_ID),
      environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
      implementation: "placeholder",
    },
    klarna: {
      configured:
        hasValue(process.env.KLARNA_USERNAME) &&
        hasValue(process.env.KLARNA_PASSWORD),
      implementation: "placeholder",
    },
  };
}
