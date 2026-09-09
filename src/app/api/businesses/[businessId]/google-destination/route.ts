import { NextResponse } from "next/server";
import { getBusinessGoogleDestination, setBusinessGoogleDestination } from "@/lib/business-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

type Params = { params: Promise<{ businessId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { businessId } = await params;
    const destination = await getBusinessGoogleDestination(businessId);
    if (!destination) {
      return NextResponse.json({ error: "Google destination not found" }, { status: 404 });
    }
    return NextResponse.json({ destination });
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const admin = await requireSuperAdmin();
    const { businessId } = await params;
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const reviewUrl = typeof body.reviewUrl === "string" ? body.reviewUrl.trim() : "";

    if (!reviewUrl) {
      return NextResponse.json({ error: "Google review URL is required" }, { status: 400 });
    }

    const destination = await setBusinessGoogleDestination(businessId, reviewUrl, admin.id);
    if (!destination) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ destination }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return authorizationErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const admin = await requireSuperAdmin();
    const { businessId } = await params;
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const reviewUrl = typeof body.reviewUrl === "string" ? body.reviewUrl.trim() : "";

    if (!reviewUrl) {
      return NextResponse.json({ error: "Google review URL is required" }, { status: 400 });
    }

    const destination = await setBusinessGoogleDestination(businessId, reviewUrl, admin.id);
    if (!destination) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ destination });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return authorizationErrorResponse(error);
  }
}
