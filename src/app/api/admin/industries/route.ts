import { NextResponse } from "next/server";
import { createIndustry, listIndustries } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

export async function GET() {
  try { await requireSuperAdmin(); return NextResponse.json({ industries: await listIndustries() }); }
  catch (error) { return authorizationErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json().catch(() => ({})) as { name?: unknown };
    if (typeof body.name !== "string") return NextResponse.json({ error: "Industry name is required" }, { status: 400 });
    return NextResponse.json({ industry: await createIndustry(body.name) }, { status: 201 });
  } catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
