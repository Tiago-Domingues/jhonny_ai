/** Store owner. Always an admin, never removable from the client list. */
export const PRIMARY_ADMIN_EMAIL = "tiagopaixaodomingues@gmail.com";

export function defaultAdminEmails() {
  return [PRIMARY_ADMIN_EMAIL];
}

export function canAdminRemoveCustomer(input: {
  actorId: string;
  targetId: string;
  targetEmail: string;
  protectedEmails: Iterable<string>;
}) {
  if (input.actorId === input.targetId) {
    return { ok: false as const, message: "You cannot remove your own account." };
  }
  const protectedSet = new Set(
    [...input.protectedEmails].map((email) => email.trim().toLowerCase()).filter(Boolean)
  );
  if (protectedSet.has(input.targetEmail.trim().toLowerCase())) {
    return { ok: false as const, message: "This admin account is protected." };
  }
  return { ok: true as const };
}
