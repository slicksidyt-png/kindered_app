import { NextResponse } from "next/server";
import { createQrCode, listBusinesses, listQrCodes } from "@/lib/qr-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

export async function GET() {
  try {
    await requireSuperAdmin();
    const [qrCodes, businesses] = await Promise.all([listQrCodes(), listBusinesses()]);
    return NextResponse.json({ qrCodes, businesses });
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json().catch(() => ({})) as { label?: unknown; businessId?: unknown; subscriptionStartAt?: unknown; subscriptionEndAt?: unknown };
    if (body.label !== undefined && (typeof body.label !== "string" || body.label.length > 120)) return NextResponse.json({ error: "Label must be 120 characters or fewer" }, { status: 400 });
    if (body.businessId !== undefined && body.businessId !== null && typeof body.businessId !== "string") return NextResponse.json({ error: "Invalid business" }, { status: 400 });
    const start = body.subscriptionStartAt ? new Date(String(body.subscriptionStartAt)) : new Date();
    const end = body.subscriptionEndAt ? new Date(String(body.subscriptionEndAt)) : null;
    if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime())) || (end && end <= start)) return NextResponse.json({ error: "Subscription end must be after the start date" }, { status: 400 });
    return NextResponse.json({ qrCode: await createQrCode(typeof body.label === "string" ? body.label : "", typeof body.businessId === "string" ? body.businessId : null, start, end) }, { status: 201 });
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}
