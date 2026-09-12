import { NextResponse } from "next/server";
import { deleteKnowledgeBase, listKnowledgeBase, saveKnowledgeBase } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

type Params = { params: Promise<{ businessId: string }> };

export async function GET(request: Request, { params }: Params) {
  try { await requireSuperAdmin(); const { businessId } = await params; return NextResponse.json({ entries: await listKnowledgeBase(businessId, new URL(request.url).searchParams.get("type") ?? undefined) }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}

export async function POST(request: Request, { params }: Params) {
  try { await requireSuperAdmin(); return NextResponse.json({ entry: await saveKnowledgeBase((await params).businessId, undefined, await request.json()) }, { status: 201 }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}

export async function PATCH(request: Request, { params }: Params) {
  try { await requireSuperAdmin(); const body = await request.json(); return NextResponse.json({ entry: await saveKnowledgeBase((await params).businessId, typeof body.id === "string" ? body.id : undefined, body) }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}

export async function DELETE(request: Request, { params }: Params) {
  try { await requireSuperAdmin(); const body = await request.json(); if (typeof body.id !== "string") return NextResponse.json({ error: "Entry ID is required" }, { status: 400 }); await deleteKnowledgeBase((await params).businessId, body.id); return NextResponse.json({ ok: true }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
