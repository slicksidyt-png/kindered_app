import { prisma } from "@/lib/prisma";

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 140);

function parseDate(value: unknown, fallback = new Date()) {
  if (value === undefined || value === null || value === "") return fallback;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return date;
}

function addDuration(start: Date, type: "DAY" | "MONTH", value: number) {
  const end = new Date(start);
  if (type === "DAY") end.setUTCDate(end.getUTCDate() + value);
  else end.setUTCMonth(end.getUTCMonth() + value);
  return end;
}

export async function listIndustries() {
  return prisma.industry.findMany({ include: { subcategories: { orderBy: { name: "asc" } }, _count: { select: { businesses: true } } }, orderBy: { name: "asc" } });
}

export async function createIndustry(name: string) {
  const cleanName = name.trim().slice(0, 120);
  if (!cleanName) throw new Error("Industry name is required");
  return prisma.industry.create({ data: { name: cleanName, slug: slugify(cleanName) } });
}

export async function updateIndustry(id: string, input: { name?: string; isActive?: boolean }) {
  const data = { name: input.name?.trim().slice(0, 120), slug: input.name ? slugify(input.name) : undefined, isActive: input.isActive };
  return prisma.industry.update({ where: { id }, data });
}

export async function deleteIndustry(id: string) {
  const count = await prisma.business.count({ where: { industryId: id } });
  if (count) throw new Error("Industry is assigned to existing businesses");
  return prisma.industry.delete({ where: { id } });
}

export async function listSubcategories(industryId?: string) {
  return prisma.subcategory.findMany({ where: industryId ? { industryId } : undefined, include: { industry: true, _count: { select: { businesses: true } } }, orderBy: [{ industry: { name: "asc" } }, { name: "asc" }] });
}

export async function validateIndustrySubcategory(industryId?: string | null, subcategoryId?: string | null) {
  if (subcategoryId) {
    const subcategory = await prisma.subcategory.findUnique({ where: { id: subcategoryId }, select: { industryId: true } });
    if (!subcategory) throw new Error("Subcategory not found");
    if (industryId && subcategory.industryId !== industryId) throw new Error("Subcategory does not belong to the selected industry");
  }
  if (industryId && !(await prisma.industry.findUnique({ where: { id: industryId }, select: { id: true } }))) throw new Error("Industry not found");
}

export async function createSubcategory(industryId: string, name: string) {
  await validateIndustrySubcategory(industryId);
  const cleanName = name.trim().slice(0, 120);
  if (!cleanName) throw new Error("Subcategory name is required");
  return prisma.subcategory.create({ data: { industryId, name: cleanName, slug: slugify(cleanName) } });
}

export async function updateSubcategory(id: string, input: { industryId?: string; name?: string; isActive?: boolean }) {
  const current = await prisma.subcategory.findUnique({ where: { id }, select: { industryId: true } });
  if (!current) throw new Error("Subcategory not found");
  await validateIndustrySubcategory(input.industryId ?? current.industryId);
  return prisma.subcategory.update({ where: { id }, data: { industryId: input.industryId, name: input.name?.trim().slice(0, 120), slug: input.name ? slugify(input.name) : undefined, isActive: input.isActive } });
}

export async function deleteSubcategory(id: string) {
  const count = await prisma.business.count({ where: { subcategoryId: id } });
  if (count) throw new Error("Subcategory is assigned to existing businesses");
  return prisma.subcategory.delete({ where: { id } });
}

async function validateQuestionScope(input: { scope: "GLOBAL" | "INDUSTRY" | "SUBCATEGORY" | "BUSINESS"; industryId?: string | null; subcategoryId?: string | null; businessId?: string | null }) {
  if (input.scope === "GLOBAL" && (input.industryId || input.subcategoryId || input.businessId)) throw new Error("Global questions cannot have an assignment");
  if (input.scope === "INDUSTRY" && (!input.industryId || input.subcategoryId || input.businessId)) throw new Error("Industry questions require only an industry");
  if (input.scope === "SUBCATEGORY" && (!input.subcategoryId || input.businessId)) throw new Error("Subcategory questions require a subcategory");
  if (input.scope === "BUSINESS" && !input.businessId) throw new Error("Business questions require a business");
  await validateIndustrySubcategory(input.industryId, input.subcategoryId);
  if (input.scope === "SUBCATEGORY") {
    const subcategory = await prisma.subcategory.findUnique({ where: { id: input.subcategoryId! }, select: { industryId: true } });
    if (!subcategory) throw new Error("Subcategory not found");
  }
  if (input.businessId && !(await prisma.business.findUnique({ where: { id: input.businessId }, select: { id: true } }))) throw new Error("Business not found");
}

function normalizeApplicableStarRatings(value: unknown): number[] {
  const values = Array.isArray(value) ? value : [];
  const normalized = [...new Set(values.map((entry) => Number(entry)).filter((entry) => Number.isInteger(entry) && entry >= 1 && entry <= 5))];
  return normalized.sort((left, right) => left - right);
}

export async function listQuestions() {
  return prisma.question.findMany({ include: { industry: true, subcategory: true, business: { select: { id: true, name: true } }, options: { orderBy: { displayOrder: "asc" } }, keywords: { include: { keyword: true } } }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });
}

export async function createQuestion(input: { text: string; scope: "GLOBAL" | "INDUSTRY" | "SUBCATEGORY" | "BUSINESS"; type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "YES_NO" | "RATING" | "STAR_RATING" | "TEXT" | "NUMBER" | "SCALE"; isActive?: boolean; isRequired?: boolean; displayOrder?: number; industryId?: string | null; subcategoryId?: string | null; businessId?: string | null; applicableStarRatings?: number[]; options?: Array<{ label: string; value?: string; displayOrder?: number }>; keywords?: string[] }) {
  const text = input.text.trim();
  if (!text) throw new Error("Question text is required");
  await validateQuestionScope(input);
  const applicableStarRatings = normalizeApplicableStarRatings(input.applicableStarRatings);
  const keywords = [...new Set((input.keywords ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean))];
  return prisma.question.create({ data: { text, scope: input.scope, type: input.type, isActive: input.isActive ?? true, isRequired: input.isRequired ?? false, displayOrder: input.displayOrder ?? 0, applicableStarRatings, industryId: input.industryId, subcategoryId: input.subcategoryId, businessId: input.businessId, options: { create: (input.options ?? []).map((option, index) => ({ label: option.label.trim(), value: (option.value ?? option.label).trim(), displayOrder: option.displayOrder ?? index })) }, keywords: { create: await Promise.all(keywords.map(async (value) => ({ keyword: { connectOrCreate: { where: { value }, create: { value } } } }))) } }, include: { options: true, keywords: { include: { keyword: true } } } });
}

export async function updateQuestion(id: string, input: Parameters<typeof createQuestion>[0]) {
  await validateQuestionScope(input);
  const applicableStarRatings = normalizeApplicableStarRatings(input.applicableStarRatings);
  const keywords = [...new Set((input.keywords ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean))];
  return prisma.$transaction(async (transaction) => {
    await transaction.questionOption.deleteMany({ where: { questionId: id } });
    await transaction.questionKeyword.deleteMany({ where: { questionId: id } });
    return transaction.question.update({ where: { id }, data: { text: input.text.trim(), scope: input.scope, type: input.type, isActive: input.isActive ?? true, isRequired: input.isRequired ?? false, displayOrder: input.displayOrder ?? 0, applicableStarRatings, industryId: input.industryId, subcategoryId: input.subcategoryId, businessId: input.businessId, options: { create: (input.options ?? []).map((option, index) => ({ label: option.label.trim(), value: (option.value ?? option.label).trim(), displayOrder: option.displayOrder ?? index })) }, keywords: { create: await Promise.all(keywords.map(async (value) => ({ keyword: { connectOrCreate: { where: { value }, create: { value } } } }))) } }, include: { options: true, keywords: { include: { keyword: true } } } });
  });
}

export async function deleteQuestion(id: string) {
  return prisma.question.delete({ where: { id } });
}

export async function getApplicableQuestions(businessId: string, starRating?: number | null) {
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { industryId: true, subcategoryId: true } });
  if (!business) return [];
  const validStarRating = typeof starRating === "number" && Number.isInteger(starRating) && starRating >= 1 && starRating <= 5 ? starRating : null;
  const scopes = [
    ...(business.subcategoryId ? [{ scope: "BUSINESS" as const, businessId }] : [{ scope: "BUSINESS" as const, businessId }]),
    ...(business.subcategoryId ? [{ scope: "SUBCATEGORY" as const, subcategoryId: business.subcategoryId }] : []),
    ...(business.industryId ? [{ scope: "INDUSTRY" as const, industryId: business.industryId }] : []),
    { scope: "GLOBAL" as const },
  ];

  const questions = await prisma.question.findMany({
    where: { isActive: true, OR: scopes },
    include: { options: { orderBy: { displayOrder: "asc" } }, keywords: { include: { keyword: true } } },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  const scopePriority: Record<"GLOBAL" | "INDUSTRY" | "SUBCATEGORY" | "BUSINESS", number> = { GLOBAL: 1, INDUSTRY: 2, SUBCATEGORY: 3, BUSINESS: 4 };
  const seen = new Set<string>();
  return questions
    .filter((question) => {
      if (validStarRating !== null && question.applicableStarRatings.length > 0 && !question.applicableStarRatings.includes(validStarRating)) return false;
      const key = question.text.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      const priorityDifference = scopePriority[right.scope] - scopePriority[left.scope];
      if (priorityDifference !== 0) return priorityDifference;
      return left.displayOrder - right.displayOrder || left.createdAt.getTime() - right.createdAt.getTime();
    });
}

export async function listKnowledgeBase(businessId: string, type?: string) {
  if (!(await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } }))) throw new Error("Business not found");
  return prisma.knowledgeBaseEntry.findMany({ where: { businessId, type: type as never }, orderBy: { updatedAt: "desc" } });
}

export async function saveKnowledgeBase(businessId: string, id: string | undefined, input: { title: string; content: string; type: "BUSINESS_INFORMATION" | "SERVICES" | "PRODUCTS" | "PRICING" | "FAQ" | "POLICIES" | "OPENING_HOURS" | "STAFF" | "CONTACT_INFORMATION" | "OTHER"; isActive?: boolean }) {
  if (!(await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } }))) throw new Error("Business not found");
  const data = { title: input.title.trim(), content: input.content.trim(), type: input.type, isActive: input.isActive ?? true };
  if (!data.title || !data.content) throw new Error("Knowledge title and content are required");
  if (id) {
    const current = await prisma.knowledgeBaseEntry.findFirst({ where: { id, businessId }, select: { id: true } });
    if (!current) throw new Error("Knowledge entry not found");
    return prisma.knowledgeBaseEntry.update({ where: { id }, data });
  }
  return prisma.knowledgeBaseEntry.create({ data: { businessId, ...data } });
}

export async function deleteKnowledgeBase(businessId: string, id: string) {
  const current = await prisma.knowledgeBaseEntry.findFirst({ where: { id, businessId }, select: { id: true } });
  if (!current) throw new Error("Knowledge entry not found");
  return prisma.knowledgeBaseEntry.delete({ where: { id } });
}

export async function listPlans() { return prisma.subscriptionPlan.findMany({ orderBy: { durationValue: "asc" } }); }

export async function savePlan(id: string | undefined, input: { name: string; durationType: "DAY" | "MONTH"; durationValue: number; price: number; isActive?: boolean }) {
  if (!input.name.trim() || !Number.isInteger(input.durationValue) || input.durationValue <= 0 || input.price < 0) throw new Error("Invalid subscription plan");
  const data = { name: input.name.trim(), durationType: input.durationType, durationValue: input.durationValue, price: input.price, isActive: input.isActive ?? true };
  return id ? prisma.subscriptionPlan.update({ where: { id }, data }) : prisma.subscriptionPlan.create({ data });
}

export async function deletePlan(id: string) {
  const count = await prisma.businessSubscription.count({ where: { planId: id } });
  if (count) throw new Error("Subscription plan is used by subscription history");
  return prisma.subscriptionPlan.delete({ where: { id } });
}

export async function listSubscriptions(status?: string) {
  const subscriptions = await prisma.businessSubscription.findMany({ where: status ? { status: status as never } : undefined, include: { business: { select: { id: true, name: true } }, plan: true }, orderBy: { endDate: "desc" } });
  const now = new Date();
  return Promise.all(subscriptions.map(async (subscription) => {
    const nextStatus = subscription.cancelledAt ? "CANCELLED" : subscription.endDate <= now ? subscription.kind === "TRIAL" ? "TRIAL_EXPIRED" : "SUBSCRIPTION_EXPIRED" : subscription.kind === "TRIAL" ? "TRIAL_ACTIVE" : "SUBSCRIPTION_ACTIVE";
    return nextStatus === subscription.status ? subscription : prisma.businessSubscription.update({ where: { id: subscription.id }, data: { status: nextStatus } });
  }));
}

export async function assignSubscription(input: { businessId: string; planId?: string; kind?: "TRIAL" | "PAID"; startDate?: unknown }) {
  const business = await prisma.business.findUnique({ where: { id: input.businessId }, select: { id: true } });
  if (!business) throw new Error("Business not found");
  const startDate = parseDate(input.startDate);
  let plan = input.planId ? await prisma.subscriptionPlan.findUnique({ where: { id: input.planId } }) : null;
  const kind = input.kind ?? "PAID";
  if (kind === "TRIAL") plan = null;
  if (kind === "PAID" && !plan) throw new Error("A paid subscription requires a plan");
  const endDate = kind === "TRIAL" ? addDuration(startDate, "DAY", 7) : addDuration(startDate, plan!.durationType, plan!.durationValue);
  return prisma.businessSubscription.create({ data: { businessId: input.businessId, planId: plan?.id, kind, status: kind === "TRIAL" ? "TRIAL_ACTIVE" : "SUBSCRIPTION_ACTIVE", startDate, endDate }, include: { plan: true, business: { select: { id: true, name: true } } } });
}

export async function refreshSubscriptionStatus(id: string) {
  const subscription = await prisma.businessSubscription.findUnique({ where: { id } });
  if (!subscription) return null;
  const now = new Date();
  const status = subscription.cancelledAt ? "CANCELLED" : subscription.endDate <= now ? subscription.kind === "TRIAL" ? "TRIAL_EXPIRED" : "SUBSCRIPTION_EXPIRED" : subscription.kind === "TRIAL" ? "TRIAL_ACTIVE" : "SUBSCRIPTION_ACTIVE";
  return status === subscription.status ? subscription : prisma.businessSubscription.update({ where: { id }, data: { status } });
}

export async function getBusinessSubscriptionStatus(businessId: string) {
  const subscriptions = await prisma.businessSubscription.findMany({ where: { businessId }, orderBy: { endDate: "desc" } });
  const current = subscriptions.find((subscription) => subscription.startDate <= new Date() && subscription.endDate > new Date() && !subscription.cancelledAt);
  if (current) await refreshSubscriptionStatus(current.id);
  return current ? { ...current, remainingDays: Math.max(0, Math.ceil((current.endDate.getTime() - Date.now()) / 86400000)) } : null;
}

export async function ensureTrial(businessId: string, startDate?: unknown) {
  const existing = await prisma.businessSubscription.findFirst({ where: { businessId, kind: "TRIAL" }, select: { id: true } });
  return existing ? null : assignSubscription({ businessId, kind: "TRIAL", startDate });
}

export async function listSuperQrs() { return prisma.superQr.findMany({ include: { _count: { select: { scans: true } } }, orderBy: { createdAt: "desc" } }); }

export async function createSuperQr(label = "Demo QR") {
  const token = `demo_${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return prisma.superQr.create({ data: { publicToken: token, label: label.trim().slice(0, 120) || "Demo QR", dynamicUrl: `${appUrl}/super/${token}` } });
}

export async function setSuperQrActive(token: string, isActive: boolean) { return prisma.superQr.update({ where: { publicToken: token }, data: { isActive } }); }

export async function getSuperQr(token: string) { return prisma.superQr.findUnique({ where: { publicToken: token } }); }

export async function getAuthorizedSuperQrBusinesses(token: string) {
  const qr = await prisma.superQr.findUnique({
    where: { publicToken: token },
    select: { id: true, publicToken: true, isActive: true },
  });
  if (!qr || !qr.isActive) return [];

  const businesses = await prisma.business.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      location: true,
      initial: true,
      status: true,
      industry: { select: { id: true, name: true } },
      subcategory: { select: { id: true, name: true } },
      qrCodes: { where: { status: "active" }, select: { publicCode: true, dynamicUrl: true }, take: 1 },
    },
  });

  return businesses.map((business) => ({
    id: business.id,
    name: business.name,
    location: business.location ?? "",
    initial: business.initial ?? business.name.slice(0, 1).toUpperCase(),
    industry: business.industry?.name ?? null,
    subcategory: business.subcategory?.name ?? null,
    qrCode: business.qrCodes[0]?.publicCode ?? null,
    reviewUrl: business.qrCodes[0]?.dynamicUrl ?? null,
  })).filter((business) => business.qrCode !== null);
}

export async function recordSuperQrScan(token: string, userAgent?: string) {
  const qr = await prisma.superQr.findUnique({ where: { publicToken: token } });
  if (!qr || !qr.isActive) return null;
  await prisma.superQrScan.create({ data: { superQrId: qr.id, userAgent: userAgent?.slice(0, 1000) } });
  return qr;
}
