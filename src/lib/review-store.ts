import { prisma } from "@/lib/prisma";

const languages = ["English", "Hindi", "Marathi", "Minglish", "Hinglish"] as const;
export type ReviewLanguage = (typeof languages)[number];

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function isReviewLanguage(value: unknown): value is ReviewLanguage {
  return typeof value === "string" && languages.includes(value as ReviewLanguage);
}

async function getSession(sessionId: string) {
  return prisma.reviewSession.findUnique({
    where: { id: sessionId },
    include: { business: true, googleDestination: true },
  });
}

export async function getReviewSession(sessionId: string) {
  return getSession(sessionId);
}

export async function saveFeedback(sessionId: string, input: { rating: number; themes: unknown; comment?: unknown; highlight?: unknown; moment?: unknown; recommendationText?: unknown; language?: unknown }) {
  const session = await getSession(sessionId);
  if (!session) return null;
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new Error("Rating must be an integer from 1 to 5");
  const themes = Array.isArray(input.themes) ? input.themes.filter((theme): theme is string => typeof theme === "string").map((theme) => theme.trim()).filter(Boolean).slice(0, 5) : [];
  const language = isReviewLanguage(input.language) ? input.language : session.language;
  const feedback = await prisma.$transaction(async (transaction) => {
    const saved = await transaction.feedbackSubmission.upsert({
      where: { sessionId },
      update: { rating: input.rating, themes, comment: cleanText(input.comment, 500) || null, highlight: cleanText(input.highlight, 1000) || null, moment: cleanText(input.moment, 2000) || null, recommendationText: cleanText(input.recommendationText, 1000) || null },
      create: { sessionId, businessId: session.businessId, rating: input.rating, themes, comment: cleanText(input.comment, 500) || null, highlight: cleanText(input.highlight, 1000) || null, moment: cleanText(input.moment, 2000) || null, recommendationText: cleanText(input.recommendationText, 1000) || null },
    });
    await transaction.reviewSession.update({ where: { id: sessionId }, data: { language, status: "feedback_submitted", lastActivityAt: new Date() } });
    return saved;
  });
  return feedback;
}

export async function createDraft(sessionId: string, input: { content: unknown; kind: "ai_generated" | "manual"; language?: unknown; modelName?: string | null }) {
  const session = await getSession(sessionId);
  if (!session) return null;
  const content = cleanText(input.content, 5000);
  if (!content) throw new Error("Draft content is required");
  const language = isReviewLanguage(input.language) ? input.language : session.language;
  return prisma.reviewDraft.create({ data: { sessionId, feedbackSubmissionId: (await prisma.feedbackSubmission.findUnique({ where: { sessionId }, select: { id: true } }))?.id, kind: input.kind, content, language, modelName: input.modelName ?? null } });
}

export async function selectDraft(sessionId: string, draftId: string) {
  return prisma.$transaction(async (transaction) => {
    const draft = await transaction.reviewDraft.findFirst({ where: { id: draftId, sessionId } });
    if (!draft) return null;
    await transaction.reviewDraft.updateMany({ where: { sessionId }, data: { isSelected: false, selectedAt: null } });
    return transaction.reviewDraft.update({ where: { id: draftId }, data: { isSelected: true, selectedAt: new Date() } });
  });
}

export async function savePrivateFeedback(sessionId: string, input: { message: unknown; customerName?: unknown; customerContact?: unknown }) {
  const session = await getSession(sessionId);
  if (!session) return null;
  const message = cleanText(input.message, 5000);
  if (!message) throw new Error("Private feedback message is required");
  const feedback = await prisma.feedbackSubmission.findUnique({ where: { sessionId }, select: { id: true } });
  return prisma.privateFeedback.upsert({
    where: { sessionId },
    update: { message, customerName: cleanText(input.customerName, 160) || null, customerContact: cleanText(input.customerContact, 320) || null, feedbackSubmissionId: feedback?.id ?? null },
    create: { sessionId, businessId: session.businessId, message, customerName: cleanText(input.customerName, 160) || null, customerContact: cleanText(input.customerContact, 320) || null, feedbackSubmissionId: feedback?.id ?? null },
  });
}

export async function recordGoogleClick(sessionId: string, draftId?: string) {
  const session = await getSession(sessionId);
  if (!session || !session.googleDestination) return null;
  const destinationId = session.googleDestination.id;
  const draft = draftId ? await prisma.reviewDraft.findFirst({ where: { id: draftId, sessionId }, select: { id: true } }) : await prisma.reviewDraft.findFirst({ where: { sessionId, isSelected: true }, select: { id: true } });
  return prisma.$transaction(async (transaction) => {
    const click = await transaction.googleReviewClick.create({ data: { sessionId, qrCodeId: session.qrCodeId, businessId: session.businessId, destinationId, draftId: draft?.id } });
    await transaction.reviewSession.update({ where: { id: sessionId }, data: { status: "google_clicked", lastActivityAt: new Date() } });
    return click;
  });
}

export async function getDashboardMetrics() {
  const [feedbackCount, average, googleClicks, privateFeedbackCount, ratings] = await Promise.all([
    prisma.feedbackSubmission.count(),
    prisma.feedbackSubmission.aggregate({ _avg: { rating: true } }),
    prisma.googleReviewClick.count(),
    prisma.privateFeedback.count(),
    prisma.feedbackSubmission.groupBy({ by: ["rating"], _count: { _all: true }, orderBy: { rating: "asc" } }),
  ]);
  return { feedbackCount, averageRating: average._avg.rating ?? 0, googleClicks, privateFeedbackCount, ratings: ratings.map((item) => ({ rating: item.rating, count: item._count._all })) };
}