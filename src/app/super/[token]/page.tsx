import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "../../../../auth";
import { getAuthorizedSuperQrBusinesses, recordSuperQrScan } from "@/lib/platform-store";

type Props = { params: Promise<{ token: string }> };

export default async function SuperQrPage({ params }: Props) {
  const { token } = await params;
  const session = await auth();
  const isAuthorized = session?.user?.platformRole === "SUPER_ADMIN";
  const qr = await recordSuperQrScan(token);
  if (!qr || !isAuthorized) notFound();

  const businesses = await getAuthorizedSuperQrBusinesses(token);

  return <main className="customer-shell"><div className="ambient-photo" /><div className="ambient-grid" /><section className="review-card welcome-card"><div className="welcome-content"><div className="business-pill"><span className="hotel-monogram">K</span><span><b>Kindred Demo</b><small>Demonstration workspace</small></span><span className="verified-dot">✓</span></div><div className="welcome-hero"><p className="eyebrow">Super QR demonstration</p><h1>Select a business to demo.</h1><p className="hero-copy">This demo opens the same review flow that a normal business QR would use.</p></div>{businesses.length ? <div className="management-list" style={{ marginTop: 24, width: "100%" }}>
            {businesses.map((business) => <Link key={business.id} href={`/r/${encodeURIComponent(business.qrCode!)}`} className="management-row" style={{ display: "flex", justifyContent: "space-between", width: "100%", textDecoration: "none", color: "inherit" }}>
              <div><b>{business.name}</b><small>{business.location || "No location yet"}{business.industry ? ` · ${business.industry}` : ""}{business.subcategory ? ` · ${business.subcategory}` : ""}</small></div>
              <span className="verified-dot" style={{ marginLeft: 12 }}>→</span>
            </Link>)}
          </div> : <p className="footer-note">No active demo businesses are available yet.</p>}
        <p className="footer-note" style={{ marginTop: 20 }}>Internal demo access only. Public users are not permitted to browse this list.</p></div></section></main>;
}
