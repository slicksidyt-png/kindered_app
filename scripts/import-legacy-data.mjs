import "dotenv/config";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to import legacy data");

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });
const legacyBusinessId = "business_hotel_sai_palace";
const businessSlug = "hotel-sai-palace";
const businessName = process.env.LEGACY_BUSINESS_NAME || "Hotel Sai Palace";
const businessLocation = process.env.LEGACY_BUSINESS_LOCATION || "Udaipur, Rajasthan";
const businessInitial = process.env.LEGACY_BUSINESS_INITIAL || "S";
const googleReviewUrl = process.env.LEGACY_GOOGLE_REVIEW_URL || "https://www.google.com/search?q=Hotel+Sai+Palace+Udaipur+reviews";

const legacyPath = new URL("../data/qr-codes.json", import.meta.url);
const legacyQrCodes = JSON.parse(await readFile(legacyPath, "utf8"));

if (!Array.isArray(legacyQrCodes)) throw new Error("data/qr-codes.json must contain an array");

try {
  const business = await prisma.business.upsert({
    where: { slug: businessSlug },
    update: { name: businessName, location: businessLocation, initial: businessInitial, status: "active" },
    create: { name: businessName, slug: businessSlug, location: businessLocation, initial: businessInitial, status: "active" },
  });

  const existingDestination = await prisma.businessGoogleDestination.findFirst({
    where: { businessId: business.id, reviewUrl: googleReviewUrl },
  });
  if (existingDestination) {
    await prisma.businessGoogleDestination.update({ where: { id: existingDestination.id }, data: { isCurrent: true, retiredAt: null } });
  } else {
    await prisma.businessGoogleDestination.updateMany({ where: { businessId: business.id, isCurrent: true }, data: { isCurrent: false, retiredAt: new Date() } });
    await prisma.businessGoogleDestination.create({ data: { businessId: business.id, reviewUrl: googleReviewUrl, label: "Primary Google review destination", isCurrent: true } });
  }

  for (const legacyQr of legacyQrCodes) {
    if (!legacyQr || typeof legacyQr.qrCode !== "string" || typeof legacyQr.dynamicUrl !== "string") {
      throw new Error("Each legacy QR record must contain qrCode and dynamicUrl");
    }
    if (legacyQr.businessId && legacyQr.businessId !== legacyBusinessId) {
      throw new Error(`Unsupported legacy business ID for ${legacyQr.qrCode}`);
    }

    const createdAt = new Date(legacyQr.createdAt);
    const updatedAt = new Date(legacyQr.updatedAt);
    if (Number.isNaN(createdAt.valueOf()) || Number.isNaN(updatedAt.valueOf())) throw new Error(`Invalid timestamps for ${legacyQr.qrCode}`);

    await prisma.$transaction(async (transaction) => {
      const qr = await transaction.qrCode.upsert({
        where: { publicCode: legacyQr.qrCode },
        update: {
          businessId: business.id,
          dynamicUrl: legacyQr.dynamicUrl,
          label: typeof legacyQr.label === "string" && legacyQr.label.trim() ? legacyQr.label.trim() : null,
          status: legacyQr.status === "active" ? "active" : "inactive",
        },
        create: {
          publicCode: legacyQr.qrCode,
          businessId: business.id,
          dynamicUrl: legacyQr.dynamicUrl,
          label: typeof legacyQr.label === "string" && legacyQr.label.trim() ? legacyQr.label.trim() : null,
          status: legacyQr.status === "active" ? "active" : "inactive",
          createdAt,
          updatedAt,
        },
      });

      const activeAssignment = await transaction.qrCodeAssignment.findFirst({ where: { qrCodeId: qr.id, unassignedAt: null } });
      if (!activeAssignment) await transaction.qrCodeAssignment.create({ data: { qrCodeId: qr.id, businessId: business.id, assignedAt: createdAt } });
    });
  }

  console.log(`Imported business ${business.slug} and ${legacyQrCodes.length} QR record(s). Existing scan history was not fabricated.`);
} finally {
  await prisma.$disconnect();
}