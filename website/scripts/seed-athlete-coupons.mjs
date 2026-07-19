import "dotenv/config";
import { createScriptPrismaClient } from "./prisma-client.mjs";

const prisma = createScriptPrismaClient();

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
  { name: 'Francisco "Xixo"', code: "FRANCISCOXIXO" },
  { name: "Xico Mittermayer" },
  { name: "Tomás Maio", code: "TOMASBETTENCOURT" },
  { name: "Gagau Pereira" },
  { name: "Andres Melendez" },
];

function codeFromName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

async function main() {
  for (const athlete of athletes) {
    const name = typeof athlete === "string" ? athlete : athlete.name;
    const code = typeof athlete === "string" ? codeFromName(athlete) : athlete.code || codeFromName(athlete.name);
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
