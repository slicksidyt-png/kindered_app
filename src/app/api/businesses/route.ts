import { NextResponse } from "next/server";
import { createBusiness, listBusinessesWithMetrics } from "@/lib/business-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

export async function GET() {
  try {
    await requireSuperAdmin();
    const businesses = await listBusinessesWithMetrics();
    return NextResponse.json({ businesses });
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin();
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;

    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    if (body.status !== undefined && body.status !== null && !["active", "inactive", "suspended"].includes(String(body.status))) {
      return NextResponse.json({ error: "Invalid business status" }, { status: 400 });
    }

    const googleReviewUrl = typeof body.googleReviewUrl === "string" ? body.googleReviewUrl.trim() : undefined;
    if (googleReviewUrl !== undefined && googleReviewUrl.length > 0) {
      try {
        new URL(googleReviewUrl);
      } catch {
        return NextResponse.json({ error: "Google review URL must be a valid URL" }, { status: 400 });
      }
    }

    const business = await createBusiness(body, admin.id);
    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return authorizationErrorResponse(error);
  }
}
