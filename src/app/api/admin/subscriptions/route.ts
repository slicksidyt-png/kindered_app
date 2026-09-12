import { NextResponse } from "next/server";
import { assignSubscription, listSubscriptions } from "@/lib/platform-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

export async function GET(request: Request) {
  try { await requireSuperAdmin(); return NextResponse.json({ subscriptions: await listSubscriptions(new URL(request.url).searchParams.get("status") ?? undefined) }); }
  catch (error) { return authorizationErrorResponse(error); }
}

export async function POST(request: Request) {
  try { await requireSuperAdmin(); return NextResponse.json({ subscription: await assignSubscription(await request.json()) }, { status: 201 }); }
  catch (error) { return error instanceof Error ? NextResponse.json({ error: error.message }, { status: 400 }) : authorizationErrorResponse(error); }
}
