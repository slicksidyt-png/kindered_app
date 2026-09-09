import { NextResponse } from "next/server";
import { savePrivateFeedback } from "@/lib/review-store";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { sessionId } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    const feedback = await savePrivateFeedback(sessionId, body);
    return feedback ? NextResponse.json({ feedback: { id: feedback.id, status: feedback.status } }, { status: 201 }) : NextResponse.json({ error: "Review session not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid private feedback" }, { status: 400 });
  }
}