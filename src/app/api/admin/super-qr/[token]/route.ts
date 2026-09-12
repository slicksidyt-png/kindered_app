import { NextResponse } from "next/server";
import { setSuperQrActive } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

type Params = { params: Promise<{ token: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try { await requireSuperAdmin(); const body = await request.json() as { isActive?: unknown }; if (typeof body.isActive !== "boolean") return NextResponse.json({ error: "isActive must be boolean" }, { status: 400 }); return NextResponse.json({ superQr: await setSuperQrActive((await params).token, body.isActive) }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
