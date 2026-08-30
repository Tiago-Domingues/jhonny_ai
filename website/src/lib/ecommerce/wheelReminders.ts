import "server-only";

import { prisma } from "@/lib/ecommerce/db";
import { sendWheelReminderEmail } from "@/lib/ecommerce/email";
import { currentPeriodKey } from "@/lib/ecommerce/prizeWheel";
import { publicSiteOrigin } from "@/lib/ecommerce/stripeCheckout";

const MAX_PER_RUN = 80;

export async function processWheelReminders() {
  const periodKey = currentPeriodKey();
  const shopUrl = `${publicSiteOrigin()}/`;
  const users = await prisma.user.findMany({
    where: {
      emailVerifiedAt: { not: null },
      profile: { is: { marketingOptIn: true } },
      wheelSpins: { none: { periodKey } },
    },
    include: { profile: true },
    take: 400,
  });

  let sent = 0;
  let skippedDeduped = 0;

  for (const user of users) {
    if (sent >= MAX_PER_RUN) break;
    const already = await prisma.emailEvent.findFirst({
      where: {
        userId: user.id,
        type: "WHEEL_REMINDER",
        subject: { contains: periodKey },
      },
      select: { id: true },
    });
    if (already) {
      skippedDeduped += 1;
      continue;
    }
    await sendWheelReminderEmail({
      userId: user.id,
      email: user.email,
      fullName: user.profile?.fullName,
      periodKey,
      shopUrl,
    });
    sent += 1;
  }

  return { periodKey, considered: users.length, sent, skippedDeduped };
}
