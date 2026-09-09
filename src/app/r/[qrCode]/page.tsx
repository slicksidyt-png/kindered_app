import { recordScan } from "@/lib/qr-store";
import { getExistingScan } from "@/lib/qr-store";
import { cookies } from "next/headers";
import ReviewEntry from "./review-entry";

type Props = { params: Promise<{ qrCode: string }> };

export default async function DynamicQrPage({ params }: Props) {
  const { qrCode } = await params;
  const sessionCookie = (await cookies()).get(`review-session-${qrCode}`)?.value;
  const existingRecord = sessionCookie ? await getExistingScan(qrCode, sessionCookie) : null;
  const record = existingRecord?.sessionId ? existingRecord : await recordScan(qrCode);
  if (!record) return <QrMessage title="QR Code Not Found" />;
  if (record.status !== "active") return <QrMessage title="This QR Code is currently inactive." />;
  if (!record.business || record.business.status !== "active") return <QrMessage title="This QR Code is not assigned to an active business." />;
  const now = new Date();
  const subscriptionActive = record.subscriptionStartAt !== null && new Date(record.subscriptionStartAt) <= now && (!record.subscriptionEndAt || new Date(record.subscriptionEndAt) > now);
  if (!subscriptionActive) return <QrMessage title="This QR Code subscription is inactive or expired." />;
  return <ReviewEntry qrCode={qrCode} sessionId={record.sessionId} />;
}

function QrMessage({ title }: { title: string }) {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Arial, sans-serif", color: "#1e2924", textAlign: "center" }}><div><h1>{title}</h1><p>Please contact the business for a new QR code.</p></div></main>;
}
