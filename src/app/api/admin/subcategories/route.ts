import { NextResponse } from "next/server";
import { createSubcategory, listSubcategories } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

export async function GET(request: Request) {
  try { await requireSuperAdmin(); return NextResponse.json({ subcategories: await listSubcategories(new URL(request.url).searchParams.get("industryId") ?? undefined) }); }
  catch (error) { return authorizationErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json().catch(() => ({})) as { industryId?: unknown; name?: unknown };
    if (typeof body.industryId !== "string" || typeof body.name !== "string") return NextResponse.json({ error: "Industry and subcategory name are required" }, { status: 400 });
    return NextResponse.json({ subcategory: await createSubcategory(body.industryId, body.name) }, { status: 201 });
  } catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
