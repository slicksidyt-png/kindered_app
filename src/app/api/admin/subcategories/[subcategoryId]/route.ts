import { NextResponse } from "next/server";
import { deleteSubcategory, updateSubcategory } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

type Params = { params: Promise<{ subcategoryId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try { await requireSuperAdmin(); return NextResponse.json({ subcategory: await updateSubcategory((await params).subcategoryId, await request.json()) }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}

export async function DELETE(_request: Request, { params }: Params) {
  try { await requireSuperAdmin(); await deleteSubcategory((await params).subcategoryId); return NextResponse.json({ ok: true }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
