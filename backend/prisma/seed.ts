// auto-generated
// prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await db.user.create({
    data: {
      name: "Admin",
      email: "admin@brain.com",
      password: "admin123", // (hash later if needed)
      role: "ADMIN",
      isVerified: true,
    },
  });

  console.log("✅ Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });