import { NextResponse } from "next/server";
import { recordGoogleClick } from "@/lib/review-store";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { sessionId } = await params;
  const body = await request.json().catch(() => ({})) as { draftId?: unknown };
  const click = await recordGoogleClick(sessionId, typeof body.draftId === "string" ? body.draftId : undefined);
  return click ? NextResponse.json({ click: { id: click.id } }, { status: 201 }) : NextResponse.json({ error: "Review session or Google destination not found" }, { status: 404 });
}