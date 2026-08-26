export type InitialsUser = {
  fullName?: string | null;
  username?: string | null;
  email?: string | null;
};

/** First + last initials from a full name, else first letter of username/email. */
export function userInitials(user: InitialsUser) {
  const name = user.fullName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] || ""}${parts[parts.length - 1]![0] || ""}`.toUpperCase();
    }
    return (parts[0]?.[0] || "?").toUpperCase();
  }
  const fallback = (user.username || user.email || "?").trim();
  return (fallback[0] || "?").toUpperCase();
}
