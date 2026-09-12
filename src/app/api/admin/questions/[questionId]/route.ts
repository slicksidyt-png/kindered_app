import { NextResponse } from "next/server";
import { deleteQuestion, updateQuestion } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

type Params = { params: Promise<{ questionId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try { await requireSuperAdmin(); return NextResponse.json({ question: await updateQuestion((await params).questionId, await request.json()) }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}

export async function DELETE(_request: Request, { params }: Params) {
  try { await requireSuperAdmin(); await deleteQuestion((await params).questionId); return NextResponse.json({ ok: true }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
