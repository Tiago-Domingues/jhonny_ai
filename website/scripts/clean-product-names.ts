/**
 * Persist cleaned product titles (empty () / trailing junk) in the local DB.
 * Display already uses cleanProductDisplayName; this keeps stored names in sync.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { cleanProductDisplayName } from "../src/lib/ecommerce/productVariants";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.log("skip: DATABASE_URL is not set");
    return;
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const products = await prisma.product.findMany({ select: { id: true, name: true } });
    let updated = 0;
    for (const product of products) {
      const cleaned = cleanProductDisplayName(product.name);
      if (!cleaned || cleaned === product.name) continue;
      await prisma.product.update({ where: { id: product.id }, data: { name: cleaned } });
      updated += 1;
      console.log(`${product.name} -> ${cleaned}`);
    }
    console.log(`cleaned ${updated} of ${products.length} product names`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
