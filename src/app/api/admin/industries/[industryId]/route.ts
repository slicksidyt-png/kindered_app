import { NextResponse } from "next/server";
import { deleteIndustry, updateIndustry } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

type Params = { params: Promise<{ industryId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { industryId } = await params;
    const body = await request.json().catch(() => ({})) as { name?: string; isActive?: boolean };
    return NextResponse.json({ industry: await updateIndustry(industryId, body) });
  } catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}

export async function DELETE(_request: Request, { params }: Params) {
  try { await requireSuperAdmin(); await deleteIndustry((await params).industryId); return NextResponse.json({ ok: true }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
