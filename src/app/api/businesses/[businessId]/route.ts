import { NextResponse } from "next/server";
import { deleteBusiness, getBusinessDetail, updateBusiness } from "@/lib/business-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

type Params = { params: Promise<{ businessId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { businessId } = await params;
    const business = await getBusinessDetail(businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    return NextResponse.json({ business });
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { businessId } = await params;
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;

    if (body.status !== undefined && body.status !== null && !["active", "inactive", "suspended"].includes(String(body.status))) {
      return NextResponse.json({ error: "Invalid business status" }, { status: 400 });
    }

    if (body.location !== undefined && typeof body.location !== "string" && body.location !== null) {
      return NextResponse.json({ error: "Invalid business location" }, { status: 400 });
    }

    const business = await updateBusiness(businessId, body);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return authorizationErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { businessId } = await params;
    const business = await deleteBusiness(businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Business permanently deleted", business });
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}
