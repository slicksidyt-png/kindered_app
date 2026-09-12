import { NextResponse } from "next/server";
import { listPlans, savePlan } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

export async function GET() {
  try { await requireSuperAdmin(); return NextResponse.json({ plans: await listPlans() }); }
  catch (error) { return authorizationErrorResponse(error); }
}

export async function POST(request: Request) {
  try { await requireSuperAdmin(); return NextResponse.json({ plan: await savePlan(undefined, await request.json()) }, { status: 201 }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
