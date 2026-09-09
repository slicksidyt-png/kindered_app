import { NextResponse } from "next/server";
import { deleteQrCode, getQrCode, updateQrCode } from "@/lib/qr-store";
import { authorizationErrorResponse, requireSuperAdmin } from "@/lib/auth-guards";

type Params = { params: Promise<{ qrCode: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { qrCode } = await params;
    const record = await getQrCode(qrCode);
    return record ? NextResponse.json(record) : NextResponse.json({ error: "QR Code Not Found" }, { status: 404 });
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { qrCode } = await params;
    const body = await request.json().catch(() => ({})) as { businessId?: unknown; label?: unknown; status?: unknown; subscriptionStartAt?: unknown; subscriptionEndAt?: unknown };
    if (body.businessId !== undefined && body.businessId !== null && (typeof body.businessId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.businessId))) return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
    if (body.label !== undefined && (typeof body.label !== "string" || body.label.length > 120)) return NextResponse.json({ error: "Label must be 120 characters or fewer" }, { status: 400 });
    if (body.status !== undefined && body.status !== "active" && body.status !== "inactive") return NextResponse.json({ error: "Invalid QR status" }, { status: 400 });
    const start = body.subscriptionStartAt === undefined ? undefined : new Date(String(body.subscriptionStartAt));
    const end = body.subscriptionEndAt === undefined || body.subscriptionEndAt === null || body.subscriptionEndAt === "" ? null : new Date(String(body.subscriptionEndAt));
    if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime())) || (start && end && end <= start)) return NextResponse.json({ error: "Subscription end must be after the start date" }, { status: 400 });
    const record = await updateQrCode(qrCode, { businessId: body.businessId as string | null | undefined, label: body.label as string | undefined, status: body.status as "active" | "inactive" | undefined, subscriptionStartAt: start, subscriptionEndAt: end });
    return record ? NextResponse.json(record) : NextResponse.json({ error: "QR Code Not Found" }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && !("status" in error)) return NextResponse.json({ error: "Unable to update QR code" }, { status: 400 });
    return authorizationErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { qrCode } = await params;
    return await deleteQrCode(qrCode) ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "QR Code Not Found" }, { status: 404 });
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}
