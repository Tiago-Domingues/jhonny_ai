import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: process.env.DATABASE_URL || "file:./prisma/dev.db",
  }),
});

const athletes = [
  "Madalena Guerreiro",
  "Francisco Horta",
  "Tomás Lacerda",
  "Miguel Kilford",
  "Érica Máximo",
  "Bernardo Tomé",
  "Mário Henrique",
  "António Dantas",
  "João Dantas",
  "Francisco Xixo",
  "Xico Mittermayer",
  "Tomás Bettencourt",
  "Gagau Pereira",
  "Andres Melendez",
];

function codeFromName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

async function main() {
  for (const name of athletes) {
    const code = codeFromName(name);
    await prisma.coupon.upsert({
      where: { code },
      update: {
        label: `${name} athlete code`,
        percentOff: 10,
        active: true,
      },
      create: {
        code,
        label: `${name} athlete code`,
        percentOff: 10,
        active: true,
      },
    });
  }

  console.log(`Seeded ${athletes.length} athlete coupons.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
