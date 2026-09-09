import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/review-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

export async function GET() {
  try {
    await requireSuperAdmin();
    return NextResponse.json(await getDashboardMetrics());
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}