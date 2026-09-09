"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReviewEntry({ qrCode, sessionId }: { qrCode: string; sessionId: string | null }) {
  const router = useRouter();
  useEffect(() => { if (sessionId) document.cookie = `review-session-${encodeURIComponent(qrCode)}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=86400; SameSite=Lax`; router.replace(`/?qr=${encodeURIComponent(qrCode)}${sessionId ? `&session=${encodeURIComponent(sessionId)}` : ""}`); }, [qrCode, router, sessionId]);
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif", color: "#1e2924" }}>Loading review experience...</main>;
}
