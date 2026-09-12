import { prisma } from "@/lib/prisma";

export type Business = {
  id: string;
  name: string;
  location: string;
  initial: string;
  googleReviewUrl: string;
  status: "active" | "inactive";
};

export type QrCode = {
  id: string;
  qrCode: string;
  businessId: string | null;
  dynamicUrl: string;
  label: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  scanCount: number;
  lastScannedAt: string | null;
  subscriptionStartAt: string | null;
  subscriptionEndAt: string | null;
};

type BusinessRecord = {
  id: string;
  name: string;
  location: string | null;
  initial: string | null;
  status: "active" | "inactive" | "suspended";
  googleDestinations: Array<{ id: string; reviewUrl: string }>;
};

function toBusiness(record: BusinessRecord): Business {
  return {
    id: record.id,
    name: record.name,
    location: record.location ?? "",
    initial: record.initial ?? record.name.slice(0, 1).toUpperCase(),
    googleReviewUrl: record.googleDestinations[0]?.reviewUrl ?? "",
    status: record.status === "active" ? "active" : "inactive",
  };
}

const businessInclude = { googleDestinations: { where: { isCurrent: true }, take: 1 } } as const;

async function getBusinessRecord(businessId: string | null) {
  if (!businessId) return null;
  return prisma.business.findUnique({ where: { id: businessId }, include: businessInclude });
}

async function toQrCode(record: {
  id: string;
  publicCode: string;
  businessId: string | null;
  dynamicUrl: string;
  label: string | null;
  status: "active" | "inactive" | "retired";
  createdAt: Date;
  updatedAt: Date;
  scans: Array<{ scannedAt: Date }>;
  assignments: Array<{ subscriptionStartAt: Date; subscriptionEndAt: Date | null }>;
  business: BusinessRecord | null;
}) {
  const scanCount = await prisma.qrScan.count({ where: { qrCodeId: record.id } });
  return {
    id: record.id,
    qrCode: record.publicCode,
    businessId: record.businessId,
    dynamicUrl: record.dynamicUrl,
    label: record.label ?? "",
    status: record.status === "active" ? "active" as const : "inactive" as const,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    scanCount,
    lastScannedAt: record.scans[0]?.scannedAt.toISOString() ?? null,
    subscriptionStartAt: record.assignments[0]?.subscriptionStartAt.toISOString() ?? null,
    subscriptionEndAt: record.assignments[0]?.subscriptionEndAt?.toISOString() ?? null,
    business: record.business ? toBusiness(record.business) : null,
  };
}

export async function getBusiness(businessId: string | null) {
  const record = await getBusinessRecord(businessId);
  return record ? toBusiness(record) : null;
}

export async function listBusinesses() {
  const records = await prisma.business.findMany({ include: businessInclude, orderBy: { name: "asc" } });
  return records.map(toBusiness);
}

export async function listQrCodes() {
  const records = await prisma.qrCode.findMany({
    where: { status: { not: "retired" } },
    include: { business: { include: businessInclude }, scans: { orderBy: { scannedAt: "desc" }, take: 1 }, assignments: { where: { unassignedAt: null }, orderBy: { assignedAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(records.map(toQrCode));
}

export async function getQrCode(qrCode: string) {
  const record = await prisma.qrCode.findUnique({
    where: { publicCode: qrCode },
    include: { business: { include: businessInclude }, scans: { orderBy: { scannedAt: "desc" }, take: 1 }, assignments: { where: { unassignedAt: null }, orderBy: { assignedAt: "desc" }, take: 1 } },
  });
  return record ? toQrCode(record) : null;
}

export async function createQrCode(label = "", businessId: string | null = null, subscriptionStartAt?: Date, subscriptionEndAt?: Date | null) {
  const qrCode = `qr_${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://192.168.0.101:3000";
  if (businessId) {
    const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
    if (!business) throw new Error("Business not found");
  }
  const record = await prisma.qrCode.create({
    data: {
      publicCode: qrCode,
      dynamicUrl: `${appUrl}/r/${qrCode}`,
      label: label.trim() || null,
      businessId,
      status: businessId ? "active" : "inactive",
      activatedAt: businessId ? new Date() : undefined,
      assignments: businessId ? { create: { businessId, subscriptionStartAt: subscriptionStartAt ?? new Date(), subscriptionEndAt: subscriptionEndAt ?? null } } : undefined,
    },
    include: { business: { include: businessInclude }, scans: true, assignments: { where: { unassignedAt: null }, orderBy: { assignedAt: "desc" }, take: 1 } },
  });
  return toQrCode(record);
}

export async function updateQrCode(qrCode: string, updates: { businessId?: string | null; label?: string; status?: "active" | "inactive"; subscriptionStartAt?: Date; subscriptionEndAt?: Date | null }) {
  const current = await prisma.qrCode.findUnique({ where: { publicCode: qrCode } });
  if (!current || current.status === "retired") return null;
  const now = new Date();
  const record = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.qrCode.update({
      where: { id: current.id },
      data: {
        businessId: updates.businessId,
        label: updates.label === undefined ? undefined : updates.label.trim() || null,
        status: updates.status,
        activatedAt: updates.status === "active" ? now : undefined,
        deactivatedAt: updates.status === "inactive" ? now : undefined,
      },
    });
    if (updates.businessId !== undefined && updates.businessId !== current.businessId) {
      if (current.businessId) await transaction.qrCodeAssignment.updateMany({ where: { qrCodeId: current.id, unassignedAt: null }, data: { unassignedAt: now } });
      if (updates.businessId) await transaction.qrCodeAssignment.create({ data: { qrCodeId: current.id, businessId: updates.businessId, assignedAt: now, subscriptionStartAt: updates.subscriptionStartAt ?? now, subscriptionEndAt: updates.subscriptionEndAt ?? null } });
    } else if (current.businessId && (updates.subscriptionStartAt !== undefined || updates.subscriptionEndAt !== undefined)) {
      await transaction.qrCodeAssignment.updateMany({ where: { qrCodeId: current.id, unassignedAt: null }, data: { subscriptionStartAt: updates.subscriptionStartAt, subscriptionEndAt: updates.subscriptionEndAt } });
    }
    return updated;
  });
  return getQrCode(record.publicCode);
}

export async function recordScan(qrCode: string) {
  const record = await prisma.qrCode.findUnique({ where: { publicCode: qrCode }, include: { business: { include: businessInclude }, assignments: { where: { unassignedAt: null }, orderBy: { assignedAt: "desc" }, take: 1 } } });
  if (!record) return null;
  const assignment = record.assignments[0];
  const now = new Date();
  const managedSubscriptions = record.businessId ? await prisma.businessSubscription.findMany({ where: { businessId: record.businessId }, select: { startDate: true, endDate: true, cancelledAt: true } }) : [];
  const managedSubscriptionActive = managedSubscriptions.some((subscription) => subscription.startDate <= now && subscription.endDate > now && !subscription.cancelledAt);
  const legacyAssignmentActive = Boolean(assignment && assignment.subscriptionStartAt <= now && (!assignment.subscriptionEndAt || assignment.subscriptionEndAt > now));
  const subscriptionActive = managedSubscriptions.length ? managedSubscriptionActive : legacyAssignmentActive;
  const outcome = record.status !== "active" ? "inactive" : !record.businessId ? "unassigned" : record.business?.status !== "active" || !subscriptionActive ? "inactive" : "accepted";
  let sessionId: string | null = null;
  await prisma.$transaction(async (transaction) => {
    const scan = await transaction.qrScan.create({ data: { qrCodeId: record.id, businessId: record.businessId, outcome } });
    if (outcome === "accepted" && record.businessId) {
      const session = await transaction.reviewSession.create({
        data: {
          qrScanId: scan.id,
          qrCodeId: record.id,
          businessId: record.businessId,
          googleDestinationId: record.business?.googleDestinations[0]?.id,
        },
      });
      sessionId = session.id;
    }
  });
  const current = await getQrCode(qrCode);
  return current ? { ...current, sessionId } : null;
}

export async function getExistingScan(qrCode: string, sessionId: string) {
  const session = await prisma.reviewSession.findFirst({ where: { id: sessionId, qrCode: { publicCode: qrCode } }, select: { id: true } });
  const current = await getQrCode(qrCode);
  return current ? { ...current, sessionId: session?.id ?? null } : null;
}

export async function deleteQrCode(qrCode: string) {
  const record = await prisma.qrCode.findUnique({ where: { publicCode: qrCode } });
  if (!record || record.status === "retired") return false;
  await prisma.qrCode.update({ where: { id: record.id }, data: { status: "retired", businessId: null, deactivatedAt: new Date() } });
  return true;
}
