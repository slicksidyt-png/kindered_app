import { NextResponse } from "next/server";
import { createDraft, getReviewSession, isReviewLanguage } from "@/lib/review-store";

const fallbackModel = "gemini-2.0-flash";

type RequestBody = {
  sessionId?: string;
  rating?: number;
  themes?: string[];
  comment?: string;
  language?: "English" | "Hindi" | "Marathi" | "Minglish" | "Hinglish";
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as RequestBody;
  if (typeof body.sessionId !== "string" || !body.sessionId) return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  const session = await getReviewSession(body.sessionId);
  if (!session) return NextResponse.json({ error: "Review session not found" }, { status: 404 });
  const businessName = session.business.name;
  const rating = Number(body.rating) || 3;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Rating must be an integer from 1 to 5" }, { status: 400 });
  const themes = Array.isArray(body.themes) ? body.themes.slice(0, 5).join(", ") : "the experience";
  const comment = body.comment?.trim() || "";
  const language = isReviewLanguage(body.language) ? body.language : session.language;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ reviews: [] });
  }

  const languageInstruction = language === "Hindi" ? "Write in natural Hindi using Devanagari script." : language === "Marathi" ? "Write in natural Marathi using Devanagari script." : language === "Minglish" ? "Write in Marathi using Latin script (Minglish), not Devanagari." : language === "Hinglish" ? "Write in Hindi using Latin script (Hinglish), not Devanagari." : "Write in natural English.";
  const prompt = `Create exactly five distinct first-person Google review drafts for ${businessName}. ${languageInstruction} Rating: ${rating}/5. Themes: ${themes}. Guest note: ${comment || "No extra note provided."}. Keep each draft honest, natural, and between 35 and 65 words. Do not invent specific facts, names, prices, or amenities. Return only a JSON array of five strings.`;
  const model = process.env.GEMINI_MODEL || fallbackModel;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.85, responseMimeType: "application/json" } }),
  });

  if (!response.ok) {
    return NextResponse.json({ reviews: [] }, { status: 200 });
  }

  const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  try {
    const parsed = JSON.parse(text);
    const reviews = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 5) : [];
    const drafts = await Promise.all(reviews.map((content) => createDraft(body.sessionId!, { content, kind: "ai_generated", language, modelName: model })));
    return NextResponse.json({ reviews, drafts: drafts.filter((draft): draft is NonNullable<typeof draft> => Boolean(draft)).map((draft) => ({ id: draft.id, content: draft.content })) });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}
