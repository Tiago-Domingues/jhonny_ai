type EnvLike = Record<string, string | undefined>;

function trimmed(env: EnvLike, key: string) {
  return env[key]?.trim() || "";
}

export function smtpCredentialsConfigured(env: EnvLike = process.env) {
  return Boolean(trimmed(env, "SMTP_HOST") && trimmed(env, "SMTP_USER") && trimmed(env, "SMTP_PASSWORD"));
}

export function resendCredentialsConfigured(env: EnvLike = process.env) {
  return Boolean(trimmed(env, "RESEND_API_KEY"));
}

export function preferredEmailProvider(env: EnvLike = process.env): "smtp" | "resend" {
  return trimmed(env, "EMAIL_PROVIDER").toLowerCase() === "resend" ? "resend" : "smtp";
}

export function isTransactionalEmailConfigured(env: EnvLike = process.env) {
  return smtpCredentialsConfigured(env) || resendCredentialsConfigured(env);
}
