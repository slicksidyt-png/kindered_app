import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!email) throw new Error("SUPER_ADMIN_EMAIL is required");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
try {
  const user = await prisma.user.upsert({
    where: { email },
    update: { status: "active", platformRole: "SUPER_ADMIN", name: process.env.SUPER_ADMIN_NAME?.trim() || undefined },
    create: { email, status: "active", platformRole: "SUPER_ADMIN", name: process.env.SUPER_ADMIN_NAME?.trim() || null },
    select: { email: true, platformRole: true, status: true },
  });
  console.log(`Provisioned ${user.email} as ${user.platformRole} with status ${user.status}.`);
} finally {
  await prisma.$disconnect();
}