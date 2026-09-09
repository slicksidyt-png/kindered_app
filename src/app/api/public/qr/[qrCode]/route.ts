import { NextResponse } from "next/server";
import { getQrCode } from "@/lib/qr-store";

type Params = { params: Promise<{ qrCode: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { qrCode } = await params;
  const record = await getQrCode(qrCode);
  if (!record) return NextResponse.json({ error: "QR Code Not Found" }, { status: 404 });
  const now = new Date();
  const subscriptionActive = record.subscriptionStartAt !== null && new Date(record.subscriptionStartAt) <= now && (!record.subscriptionEndAt || new Date(record.subscriptionEndAt) > now);
  if (record.status !== "active" || !record.business || record.business.status !== "active" || !subscriptionActive) return NextResponse.json({ error: "QR Code is not available" }, { status: 404 });
  return NextResponse.json({ business: { name: record.business.name, location: record.business.location, initial: record.business.initial, googleReviewUrl: record.business.googleReviewUrl } });
}