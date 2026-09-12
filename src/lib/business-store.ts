import { prisma } from "@/lib/prisma";
import { ensureTrial, validateIndustrySubcategory } from "@/lib/platform-store";

export type BusinessStatus = "active" | "inactive" | "suspended";

export type BusinessSummary = {
  id: string;
  name: string;
  location: string | null;
  status: BusinessStatus;
  createdAt: string;
  qrCount: number;
  scanCount: number;
  feedbackCount: number;
  averageRating: number | null;
  googleReviewUrl: string | null;
  industryId: string | null;
  subcategoryId: string | null;
  industryName: string | null;
  subcategoryName: string | null;
};

export type BusinessDetail = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  status: BusinessStatus;
  timezone: string;
  industryId: string | null;
  subcategoryId: string | null;
  industry: { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  qrCount: number;
  scanCount: number;
  feedbackCount: number;
  averageRating: number | null;
  googleDestination: {
    id: string;
    reviewUrl: string;
    isCurrent: boolean;
    createdAt: string;
  } | null;
  destinationHistory: Array<{
    id: string;
    reviewUrl: string;
    isCurrent: boolean;
    createdAt: string;
    retiredAt: string | null;
  }>;
  assignedQrs: Array<{
    qrCode: string;
    dynamicUrl: string;
    label: string;
    status: "active" | "inactive";
    scanCount: number;
    lastScannedAt: string | null;
  }>;
};

const businessStatusValues = ["active", "inactive", "suspended"] as const;

export function isBusinessStatus(value: unknown): value is BusinessStatus {
  return typeof value === "string" && businessStatusValues.includes(value as BusinessStatus);
}

export function isValidGoogleReviewUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    const allowedProtocols = new Set(["http:", "https:"]);
    const host = parsed.hostname.toLowerCase();
    const isGoogleDomain = host === "google.com"
      || host.endsWith(".google.com")
      || host === "g.page"
      || host.endsWith(".g.page")
      || host === "maps.app.goo.gl"
      || host.endsWith(".maps.app.goo.gl");
    return allowedProtocols.has(parsed.protocol) && isGoogleDomain;
  } catch {
    return false;
  }
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180) || "business";
}

async function getBusinessMetricsById(businessId: string) {
  const [metrics, destination] = await Promise.all([
    prisma.feedbackSubmission.aggregate({ where: { businessId }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.businessGoogleDestination.findFirst({
      where: { businessId, isCurrent: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, reviewUrl: true, isCurrent: true, createdAt: true },
    }),
  ]);

  return {
    averageRating: metrics._avg.rating ?? null,
    feedbackCount: metrics._count._all,
    googleDestination: destination ? { id: destination.id, reviewUrl: destination.reviewUrl, isCurrent: destination.isCurrent, createdAt: destination.createdAt.toISOString() } : null,
  };
}

export async function listBusinessesWithMetrics(): Promise<BusinessSummary[]> {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      industry: { select: { id: true, name: true } },
      subcategory: { select: { id: true, name: true } },
      googleDestinations: {
        where: { isCurrent: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { reviewUrl: true },
      },
      _count: {
        select: {
          qrCodes: true,
          scans: true,
          feedbackSubmissions: true,
        },
      },
    },
  });

  const feedbackGroups = await prisma.feedbackSubmission.groupBy({
    by: ["businessId"],
    _avg: { rating: true },
    _count: { _all: true },
  });

  const feedbackMap = new Map<string, { averageRating: number | null; count: number }>();
  for (const group of feedbackGroups) {
    feedbackMap.set(group.businessId, { averageRating: group._avg.rating ?? null, count: group._count._all });
  }

  return businesses.map((business) => {
    const feedback = feedbackMap.get(business.id) ?? { averageRating: null, count: 0 };
    return {
      id: business.id,
      name: business.name,
      location: business.location,
      status: business.status,
      createdAt: business.createdAt.toISOString(),
      qrCount: business._count.qrCodes,
      scanCount: business._count.scans,
      feedbackCount: feedback.count,
      averageRating: feedback.averageRating,
      googleReviewUrl: business.googleDestinations[0]?.reviewUrl ?? null,
      industryId: business.industryId,
      subcategoryId: business.subcategoryId,
      industryName: business.industry?.name ?? null,
      subcategoryName: business.subcategory?.name ?? null,
    };
  });
}

export async function getBusinessDetail(businessId: string): Promise<BusinessDetail | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      industry: true,
      subcategory: true,
      googleDestinations: {
        orderBy: { createdAt: "desc" },
        select: { id: true, reviewUrl: true, isCurrent: true, createdAt: true, retiredAt: true },
      },
      qrCodes: {
        where: { status: { not: "retired" } },
        orderBy: { createdAt: "desc" },
        include: { scans: { orderBy: { scannedAt: "desc" }, take: 1 }, assignments: { where: { unassignedAt: null }, orderBy: { assignedAt: "desc" }, take: 1 } },
      },
      _count: {
        select: {
          qrCodes: true,
          scans: true,
          feedbackSubmissions: true,
        },
      },
    },
  });

  if (!business) return null;

  const metrics = await getBusinessMetricsById(businessId);
  const currentDestination = business.googleDestinations.find((destination) => destination.isCurrent) ?? business.googleDestinations[0] ?? null;
  const assignedQrs = await Promise.all(business.qrCodes.map(async (qr) => ({
    qrCode: qr.publicCode,
    dynamicUrl: qr.dynamicUrl,
    label: qr.label ?? "",
    status: qr.status === "active" ? "active" as const : "inactive" as const,
    scanCount: await prisma.qrScan.count({ where: { qrCodeId: qr.id } }),
    lastScannedAt: qr.scans[0]?.scannedAt.toISOString() ?? null,
    subscriptionStartAt: qr.assignments[0]?.subscriptionStartAt.toISOString() ?? null,
    subscriptionEndAt: qr.assignments[0]?.subscriptionEndAt?.toISOString() ?? null,
  })));

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    location: business.location,
    status: business.status,
    timezone: business.timezone,
    industryId: business.industryId,
    subcategoryId: business.subcategoryId,
    industry: business.industry ? { id: business.industry.id, name: business.industry.name } : null,
    subcategory: business.subcategory ? { id: business.subcategory.id, name: business.subcategory.name } : null,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
    qrCount: business._count.qrCodes,
    scanCount: business._count.scans,
    feedbackCount: metrics.feedbackCount,
    averageRating: metrics.averageRating,
    googleDestination: currentDestination ? {
      id: currentDestination.id,
      reviewUrl: currentDestination.reviewUrl,
      isCurrent: currentDestination.isCurrent,
      createdAt: currentDestination.createdAt.toISOString(),
    } : null,
    destinationHistory: business.googleDestinations.map((destination) => ({
      id: destination.id,
      reviewUrl: destination.reviewUrl,
      isCurrent: destination.isCurrent,
      createdAt: destination.createdAt.toISOString(),
      retiredAt: destination.retiredAt?.toISOString() ?? null,
    })),
    assignedQrs,
  };
}

export async function createBusiness(input: Record<string, unknown>, createdByUserId?: string | null) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) throw new Error("Business name is required");

  const rawLocation = typeof input.location === "string" ? input.location.trim() : "";
  const location = rawLocation ? rawLocation.slice(0, 255) : null;
  const rawStatus = input.status ?? "active";
  if (!isBusinessStatus(rawStatus)) throw new Error("Invalid business status");

  const timezone = typeof input.timezone === "string" && input.timezone.trim() ? input.timezone.trim().slice(0, 64) : "Asia/Kolkata";
  const reviewUrl = typeof input.googleReviewUrl === "string" ? input.googleReviewUrl.trim() : null;
  if (reviewUrl && !isValidGoogleReviewUrl(reviewUrl)) {
    throw new Error("Google review URL must be a valid Google URL");
  }
  const industryId = typeof input.industryId === "string" ? input.industryId : null;
  const subcategoryId = typeof input.subcategoryId === "string" ? input.subcategoryId : null;
  await validateIndustrySubcategory(industryId, subcategoryId);

  const baseSlug = slugify(name);
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.business.findUnique({ where: { slug: candidate } });
    if (!existing) break;
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const business = await prisma.$transaction(async (transaction) => {
    const created = await transaction.business.create({
      data: {
        name,
        slug: candidate,
        location,
        status: rawStatus,
        timezone,
        initial: name.slice(0, 1).toUpperCase(),
        industryId,
        subcategoryId,
      },
    });

    if (reviewUrl) {
      await transaction.businessGoogleDestination.create({
        data: {
          businessId: created.id,
          reviewUrl,
          isCurrent: true,
          createdByUserId: createdByUserId ?? null,
          label: "Primary Google destination",
        },
      });
    }

    return created;
  });

  await ensureTrial(business.id, input.trialStartDate);

  return getBusinessDetail(business.id);
}

export async function updateBusiness(businessId: string, input: Record<string, unknown>) {
  const existing = await prisma.business.findUnique({ where: { id: businessId } });
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(input, "name")) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) throw new Error("Business name is required");
    updateData.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(input, "location")) {
    updateData.location = typeof input.location === "string" ? input.location.trim() || null : null;
  }

  if (Object.prototype.hasOwnProperty.call(input, "status")) {
    if (!isBusinessStatus(input.status)) throw new Error("Invalid business status");
    updateData.status = input.status;
  }

  if (Object.prototype.hasOwnProperty.call(input, "timezone")) {
    const timezone = typeof input.timezone === "string" ? input.timezone.trim() : "";
    updateData.timezone = timezone || "Asia/Kolkata";
  }

  if (Object.prototype.hasOwnProperty.call(input, "industryId") || Object.prototype.hasOwnProperty.call(input, "subcategoryId")) {
    const industryId = typeof input.industryId === "string" ? input.industryId : existing.industryId;
    const subcategoryId = typeof input.subcategoryId === "string" ? input.subcategoryId : existing.subcategoryId;
    await validateIndustrySubcategory(industryId, subcategoryId);
    updateData.industryId = industryId;
    updateData.subcategoryId = subcategoryId;
  }

  if (Object.keys(updateData).length === 0) {
    return getBusinessDetail(businessId);
  }

  const business = await prisma.business.update({
    where: { id: businessId },
    data: updateData as {
      name?: string;
      location?: string | null;
      status?: BusinessStatus;
      timezone?: string;
      industryId?: string | null;
      subcategoryId?: string | null;
    },
  });
  return getBusinessDetail(business.id);
}

export async function deleteBusiness(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return null;

  await prisma.$transaction(async (transaction) => {
    await transaction.question.deleteMany({ where: { businessId } });
    await transaction.googleReviewClick.deleteMany({ where: { businessId } });
    await transaction.privateFeedback.deleteMany({ where: { businessId } });
    await transaction.feedbackSubmission.deleteMany({ where: { businessId } });
    await transaction.reviewDraft.deleteMany({ where: { session: { businessId } } });
    await transaction.reviewSession.deleteMany({ where: { businessId } });
    await transaction.qrScan.deleteMany({ where: { businessId } });
    await transaction.qrCodeAssignment.deleteMany({ where: { businessId } });
    await transaction.businessGoogleDestination.deleteMany({ where: { businessId } });
    await transaction.qrCode.deleteMany({ where: { businessId } });
    await transaction.businessMembership.deleteMany({ where: { businessId } });
    await transaction.business.delete({ where: { id: businessId } });
  });

  return business;
}

export async function getBusinessGoogleDestination(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) return null;

  return prisma.businessGoogleDestination.findFirst({
    where: { businessId, isCurrent: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function setBusinessGoogleDestination(businessId: string, reviewUrl: string, createdByUserId?: string | null) {
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) return null;

  const normalized = reviewUrl.trim();
  if (!isValidGoogleReviewUrl(normalized)) {
    throw new Error("Google review URL must be a valid Google URL");
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.businessGoogleDestination.updateMany({
      where: { businessId, isCurrent: true },
      data: { isCurrent: false, retiredAt: new Date() },
    });

    return transaction.businessGoogleDestination.create({
      data: {
        businessId,
        reviewUrl: normalized,
        isCurrent: true,
        createdByUserId: createdByUserId ?? null,
        label: "Primary Google destination",
      },
    });
  });
}

export async function getBusinessById(businessId: string) {
  return prisma.business.findUnique({ where: { id: businessId } });
}

export function normalizeGoogleReviewUrl(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return isValidGoogleReviewUrl(trimmed) ? trimmed : null;
}

export function getCurrentBusinessDestinationUrl(business: { googleDestinations?: Array<{ reviewUrl: string; isCurrent: boolean }> | null }) {
  return business.googleDestinations?.find((destination) => destination.isCurrent)?.reviewUrl ?? business.googleDestinations?.[0]?.reviewUrl ?? null;
}

export function toBusinessStatus(value: unknown): BusinessStatus {
  if (isBusinessStatus(value)) return value;
  return "active";
}

export const businessStatusOptions = [...businessStatusValues];
