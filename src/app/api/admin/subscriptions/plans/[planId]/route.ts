import { NextResponse } from "next/server";
import { deletePlan, savePlan } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

type Params = { params: Promise<{ planId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try { await requireSuperAdmin(); return NextResponse.json({ plan: await savePlan((await params).planId, await request.json()) }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}

export async function DELETE(_request: Request, { params }: Params) {
  try { await requireSuperAdmin(); await deletePlan((await params).planId); return NextResponse.json({ ok: true }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
