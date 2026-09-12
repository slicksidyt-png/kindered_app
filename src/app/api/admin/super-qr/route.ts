import { NextResponse } from "next/server";
import { createSuperQr, listSuperQrs } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

export async function GET() {
  try { await requireSuperAdmin(); return NextResponse.json({ superQrs: await listSuperQrs() }); }
  catch (error) { return authorizationErrorResponse(error); }
}

export async function POST(request: Request) {
  try { await requireSuperAdmin(); const body = await request.json().catch(() => ({})) as { label?: unknown }; return NextResponse.json({ superQr: await createSuperQr(typeof body.label === "string" ? body.label : undefined) }, { status: 201 }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
