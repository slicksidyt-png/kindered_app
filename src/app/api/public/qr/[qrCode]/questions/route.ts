import { NextResponse } from "next/server";
import { getApplicableQuestions } from "@/lib/platform-store";
import { getQrCode } from "@/lib/qr-store";

type Params = { params: Promise<{ qrCode: string }> };

export async function GET(request: Request, { params }: Params) {
  const { qrCode } = await params;
  const record = await getQrCode(qrCode);
  if (!record || record.status !== "active" || !record.business || record.business.status !== "active") return NextResponse.json({ error: "QR Code is not available" }, { status: 404 });
  const url = new URL(request.url);
  const rating = Number(url.searchParams.get("rating") ?? "");
  const starRating = Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
  const questions = await getApplicableQuestions(record.businessId!, starRating);
  return NextResponse.json({ questions: questions.map((question) => ({ id: question.id, text: question.text, scope: question.scope, type: question.type, isRequired: question.isRequired, displayOrder: question.displayOrder, applicableStarRatings: question.applicableStarRatings ?? [], options: question.options.map((option) => ({ id: option.id, label: option.label, value: option.value, displayOrder: option.displayOrder })), keywords: question.keywords.map(({ keyword }) => keyword.value) })) });
}
