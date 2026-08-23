function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Prisma `where` for a customer’s own orders (account id or matching email). */
export function ordersWhereForUser(userId: string, email: string) {
  const normalized = normalizeEmail(email);
  return {
    OR: [{ userId }, { customerEmail: { equals: normalized, mode: "insensitive" as const } }],
  };
}

export function orderBelongsToUser(
  order: { userId?: string | null; customerEmail: string },
  userId: string,
  email: string
) {
  if (order.userId && order.userId === userId) return true;
  return normalizeEmail(order.customerEmail) === normalizeEmail(email);
}
