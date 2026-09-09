import { NextResponse } from "next/server";
import { createDraft, selectDraft, isReviewLanguage } from "@/lib/review-store";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { sessionId } = await params;
  const body = await request.json().catch(() => ({})) as { content?: unknown; kind?: unknown; language?: unknown; modelName?: unknown };
  if (body.kind !== "manual" && body.kind !== "ai_generated") return NextResponse.json({ error: "Invalid draft kind" }, { status: 400 });
  try {
    const draft = await createDraft(sessionId, { content: body.content, kind: body.kind, language: isReviewLanguage(body.language) ? body.language : undefined, modelName: typeof body.modelName === "string" ? body.modelName : null });
    return draft ? NextResponse.json({ draft }, { status: 201 }) : NextResponse.json({ error: "Review session not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid draft" }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { sessionId } = await params;
  const body = await request.json().catch(() => ({})) as { draftId?: unknown };
  if (typeof body.draftId !== "string" || !body.draftId) return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
  const draft = await selectDraft(sessionId, body.draftId);
  return draft ? NextResponse.json({ draft }) : NextResponse.json({ error: "Draft not found" }, { status: 404 });
}