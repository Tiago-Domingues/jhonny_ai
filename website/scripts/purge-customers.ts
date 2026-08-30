import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { PRIMARY_ADMIN_EMAIL } from "../src/lib/ecommerce/adminAccess";

dotenv.config({ path: ".env.local" });
dotenv.config();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function deleteCustomerRelatedData(
  tx: {
    cart: { deleteMany: (args: unknown) => Promise<unknown> };
    consentEvent: { deleteMany: (args: unknown) => Promise<unknown> };
    emailEvent: { deleteMany: (args: unknown) => Promise<unknown> };
    smsEvent: { deleteMany: (args: unknown) => Promise<unknown> };
    couponUsage: { updateMany: (args: unknown) => Promise<unknown> };
    pendingRegistration: { deleteMany: (args: unknown) => Promise<unknown> };
    availabilityRequest: { deleteMany: (args: unknown) => Promise<unknown> };
    user: { delete: (args: unknown) => Promise<unknown> };
  },
  user: { id: string; email: string }
) {
  await tx.cart.deleteMany({ where: { userId: user.id } });
  await tx.consentEvent.deleteMany({ where: { userId: user.id } });
  await tx.emailEvent.deleteMany({ where: { userId: user.id } });
  await tx.smsEvent.deleteMany({ where: { userId: user.id } });
  await tx.couponUsage.updateMany({ where: { userId: user.id }, data: { userId: null } });
  await tx.pendingRegistration.deleteMany({ where: { email: user.email } });
  await tx.availabilityRequest.deleteMany({ where: { email: user.email } });
  await tx.user.delete({ where: { id: user.id } });
}

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const keep = normalizeEmail(process.env.KEEP_ADMIN_EMAIL || PRIMARY_ADMIN_EMAIL);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      ssl: connectionString.includes("sslmode=") ? { rejectUnauthorized: false } : undefined,
    }),
  });

  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    let removed = 0;
    let kept = 0;

    for (const user of users) {
      if (normalizeEmail(user.email) === keep) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN", emailVerifiedAt: user.role === "ADMIN" ? undefined : new Date() },
        });
        kept += 1;
        continue;
      }
      await prisma.$transaction(async (tx) => {
        await deleteCustomerRelatedData(tx, user);
      });
      removed += 1;
    }

    const extras = await Promise.all([
      prisma.pendingRegistration.deleteMany({
        where: { NOT: { email: { equals: keep, mode: "insensitive" } } },
      }),
      prisma.guestCheckout.deleteMany({
        where: { NOT: { email: { equals: keep, mode: "insensitive" } } },
      }),
      prisma.availabilityRequest.deleteMany({
        where: { NOT: { email: { equals: keep, mode: "insensitive" } } },
      }),
      prisma.emailEvent.deleteMany({
        where: { userId: null, NOT: { recipientEmail: { equals: keep, mode: "insensitive" } } },
      }),
      prisma.smsEvent.deleteMany({ where: { userId: null } }),
    ]);

    const remaining = await prisma.user.findMany({ select: { email: true, role: true } });
    console.log(
      JSON.stringify(
        {
          keptEmail: keep,
          keptAccounts: kept,
          removedAccounts: removed,
          removedPending: extras[0].count,
          removedGuestCheckouts: extras[1].count,
          removedAvailabilityRequests: extras[2].count,
          remaining,
        },
        null,
        2
      )
    );
    if (remaining.some((user) => normalizeEmail(user.email) !== keep)) {
      throw new Error("purge left unexpected accounts");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
