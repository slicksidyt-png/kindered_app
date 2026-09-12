"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import {
  BarChart3,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Download,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import PlatformManagement from "./platform-management";

type MetricData = {
  feedbackCount: number;
  averageRating: number;
  googleClicks: number;
  privateFeedbackCount: number;
  ratings: Array<{ rating: number; count: number }>;
};

type BusinessSummary = {
  id: string;
  name: string;
  location: string | null;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  qrCount: number;
  scanCount: number;
  feedbackCount: number;
  averageRating: number | null;
  googleReviewUrl: string | null;
  industryName: string | null;
  subcategoryName: string | null;
};

type BusinessDetail = BusinessSummary & {
  slug: string;
  timezone: string;
  industryId: string | null;
  subcategoryId: string | null;
  updatedAt: string;
  googleDestination: { id: string; reviewUrl: string; isCurrent: boolean; createdAt: string } | null;
  destinationHistory: Array<{ id: string; reviewUrl: string; isCurrent: boolean; createdAt: string; retiredAt: string | null }>;
  assignedQrs: Array<{ qrCode: string; dynamicUrl: string; label: string; status: "active" | "inactive"; scanCount: number; lastScannedAt: string | null; subscriptionStartAt: string | null; subscriptionEndAt: string | null }>;
};

type AdminQr = {
  qrCode: string;
  dynamicUrl: string;
  label: string;
  status: "active" | "inactive";
  scanCount: number;
  lastScannedAt: string | null;
  subscriptionStartAt: string | null;
  subscriptionEndAt: string | null;
  business: { id: string; name: string; googleReviewUrl: string } | null;
};

type AdminBusiness = {
  id: string;
  name: string;
  googleReviewUrl: string;
};

type IndustryOption = { id: string; name: string; isActive: boolean; subcategories: Array<{ id: string; name: string; isActive: boolean }> };

const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Reviews", icon: Star },
  { label: "Feedback", icon: MessageSquareText },
  { label: "QR codes", icon: QrCode },
  { label: "Analytics", icon: BarChart3 },
  { label: "Businesses", icon: Building2 },
  { label: "Industries", icon: Building2 },
  { label: "Questionnaire", icon: FileText },
  { label: "Knowledge Base", icon: FileText },
  { label: "Subscriptions", icon: ShieldCheck },
  { label: "Super QR", icon: QrCode },
] as const;


export default function AdminPage() {
  const [active, setActive] = useState<string>("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="admin-shell">
      <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <span className="brand-mark"><ShieldCheck size={15} /></span>
          <b>kindred</b>
          <button className="close-menu" onClick={() => setMenuOpen(false)}><X size={19} /></button>
        </div>
        <div className="workspace-switcher">
          <span className="hotel-monogram">K</span>
          <span>
            <b>Kindred Platform</b>
            <small>Workspace</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <p className="nav-title">Workspace</p>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button key={label} className={active === label ? "active" : ""} onClick={() => { setActive(label); setMenuOpen(false); }}>
              <Icon size={17} />
              {label}
              {label === "Feedback" && <span className="nav-count">8</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button><Settings size={17} />Settings</button>
          <button><CircleHelp size={17} />Help center</button>
          <Link href="/">View customer flow <ChevronRight size={14} /></Link>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <button className="menu-toggle" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
          <div>
            <p className="admin-kicker">Platform overview</p>
            <h1>{active === "Overview" ? "Good morning" : active}</h1>
          </div>
          <div className="admin-header-actions">
            <button className="icon-action" aria-label="Search"><Search size={18} /></button>
            <button className="export-button"><Download size={15} />Export <ChevronDown size={14} /></button>
            <div className="profile-avatar">SA</div>
          </div>
        </header>

        {active === "Overview" ? <LiveOverview /> : active === "QR codes" ? <QrCodes /> : active === "Businesses" ? <BusinessesSection /> : ["Industries", "Questionnaire", "Knowledge Base", "Subscriptions", "Super QR"].includes(active) ? <PlatformManagement section={active} /> : <Placeholder title={active} />}
      </section>
    </main>
  );
}

function LiveOverview() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setMetrics(data))
      .catch(() => undefined);
  }, []);

  const value = (item: number | undefined, decimals = 0) => {
    if (item === undefined) return "—";
    return decimals ? item.toFixed(decimals) : item.toLocaleString();
  };

  return (
    <div className="dashboard-content">
      <div className="demo-banner">
        <span><SparkleDot /> Live PostgreSQL data</span>
      </div>

      <div className="metric-grid">
        <Metric label="Total feedback" value={value(metrics?.feedbackCount)} change="Live" icon={<MessageSquareText />} />
        <Metric label="Average rating" value={value(metrics?.averageRating, 1)} change="Live" icon={<Star />} accent="gold" />
        <Metric label="Google clicks" value={value(metrics?.googleClicks)} change="Live" icon={<QrCode />} />
        <Metric label="Private feedback" value={value(metrics?.privateFeedbackCount)} change="Live" icon={<Users />} muted />
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">FEEDBACK ACTIVITY</p>
              <h2>Feedback over time</h2>
            </div>
            <button className="range-button">Live totals <ChevronDown size={14} /></button>
          </div>
          <p className="section-copy">Feedback and Google click totals are read from PostgreSQL. Time-series history will appear as events accumulate.</p>
        </section>

        <section className="panel distribution-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">AT A GLANCE</p>
              <h2>Rating distribution</h2>
            </div>
            <button className="more-button" aria-label="More options"><MoreHorizontal size={18} /></button>
          </div>
          <div className="rating-total">
            <strong>{value(metrics?.averageRating, 1)}</strong>
            <div>
              <div className="stars">★★★★★</div>
              <small>Based on {value(metrics?.feedbackCount)}</small>
            </div>
          </div>
          <div className="distribution-list">
            {[5, 4, 3, 2, 1].map((star) => {
              const item = metrics?.ratings.find((entry) => entry.rating === star);
              const width = metrics ? `${(((item?.count ?? 0) / Math.max(metrics.feedbackCount || 1, 1)) * 100).toString()}%` : "0%";
              return <RatingBar key={star} stars={`${star}`} width={width} count={String(item?.count ?? 0)} />;
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, change, icon, accent, muted }: { label: string; value: string; change: string; icon: ReactNode; accent?: string; muted?: boolean }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${accent ?? ""}`}>{icon}</div>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small className={muted ? "muted-change" : "positive-change"}>{change} <span>live</span></small>
    </div>
  );
}

function RatingBar({ stars, width, count }: { stars: string; width: string; count: string }) {
  return (
    <div className="rating-bar">
      <span>{stars} <Star size={12} fill="currentColor" /></span>
      <div><i style={{ width }} /></div>
      <b>{count}</b>
    </div>
  );
}

function SparkleDot() {
  return <span className="sparkle-dot">✦</span>;
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="placeholder-view">
      <div className="placeholder-icon"><FileText size={24} /></div>
      <h2>{title} is ready for your data</h2>
      <p>Platform data will appear here as the workspace grows.</p>
      <button className="primary-admin-button"><Plus size={16} /> Create your first item</button>
    </div>
  );
}

function BusinessesSection() {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">("active");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [industryId, setIndustryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [selected, setSelected] = useState<BusinessDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCompanyCutoff] = useState(() => Date.now() - 30 * 86400000);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/businesses");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load businesses");
      setBusinesses(payload.businesses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load businesses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      try {
        const response = await fetch("/api/businesses");
        const payload = await response.json();
        if (!ignore) {
          if (!response.ok) throw new Error(payload.error || "Unable to load businesses");
          setBusinesses(payload.businesses ?? []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Unable to load businesses");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void loadData();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    fetch("/api/admin/industries").then((response) => response.ok ? response.json() : null).then((payload: { industries?: IndustryOption[] } | null) => setIndustries(payload?.industries ?? [])).catch(() => undefined);
  }, []);

  const createBusiness = async () => {
    if (!name.trim()) {
      setError("Business name is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          status,
          googleReviewUrl: googleReviewUrl.trim(),
          industryId: industryId || null,
          subcategoryId: subcategoryId || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create business");
      setName("");
      setLocation("");
      setStatus("active");
      setGoogleReviewUrl("");
      setIndustryId("");
      setSubcategoryId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create business");
    } finally {
      setSaving(false);
    }
  };

  const visibleBusinesses = businesses.filter((business) => {
    const matchesFilter = filter === "all" || business.status === filter;
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || `${business.name} ${business.location ?? ""}`.toLowerCase().includes(needle));
  });

  const openBusiness = async (businessId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/businesses/${businessId}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load business");
      setSelected(payload.business);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load business");
    }
  };

  return (
    <div className="dashboard-content business-manager">
      <div className="directory-heading">
        <div>
          <p className="panel-kicker">SALES WORKSPACE</p>
          <h2>Companies <span>{businesses.length}</span></h2>
          <p className="section-copy">Create and configure personalized demos for every sales conversation.</p>
        </div>
        <button className="primary-admin-button" onClick={() => setShowCreate((current) => !current)}><Plus size={16} /> {showCreate ? "Close form" : "Create company"}</button>
      </div>

      <div className="directory-summary-grid">
        <button className="directory-summary-card" onClick={() => setFilter("all")}><span>NEW COMPANIES</span><strong>{businesses.filter((business) => new Date(business.createdAt).getTime() > newCompanyCutoff).length}</strong><small>Click to view</small></button>
        <button className="directory-summary-card" onClick={() => setFilter("active")}><span>ACTIVE COMPANIES</span><strong>{businesses.filter((business) => business.status === "active").length}</strong><small>Click to filter</small></button>
        <button className="directory-summary-card" onClick={() => setFilter("inactive")}><span>INACTIVE COMPANIES</span><strong>{businesses.filter((business) => business.status === "inactive").length}</strong><small>Click to filter</small></button>
        <button className="directory-summary-card" onClick={() => setFilter("suspended")}><span>SUSPENDED COMPANIES</span><strong>{businesses.filter((business) => business.status === "suspended").length}</strong><small>Click to filter</small></button>
      </div>

      <div className="business-toolbar">
        <label className="business-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search businesses" /></label>
        <div className="business-filters">
          {(["all", "active", "inactive", "suspended"] as const).map((option) => <button key={option} className={filter === option ? "selected" : ""} onClick={() => setFilter(option)}>{option[0].toUpperCase() + option.slice(1)}</button>)}
        </div>
      </div>

      {showCreate && <div className="business-form-panel">
        <div className="field-grid">
          <label>
            <span>Business name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Hotel Sai Palace" />
          </label>
          <label>
            <span>Location</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or branch location" />
          </label>
          <label>
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as "active" | "inactive" | "suspended")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <label>
            <span>Industry</span>
            <select value={industryId} onChange={(event) => { setIndustryId(event.target.value); setSubcategoryId(""); }}>
              <option value="">Select industry</option>
              {industries.filter((industry) => industry.isActive).map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}
            </select>
          </label>
          <label>
            <span>Subcategory</span>
            <select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)} disabled={!industryId}>
              <option value="">Select subcategory</option>
              {(industries.find((industry) => industry.id === industryId)?.subcategories ?? []).filter((subcategory) => subcategory.isActive).map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
            </select>
          </label>
          <label className="wide-field">
            <span>Google review destination</span>
            <input value={googleReviewUrl} onChange={(event) => setGoogleReviewUrl(event.target.value)} placeholder="https://g.page/... or a valid Google review URL" />
          </label>
        </div>

        <div className="form-actions">
          <button className="primary-admin-button" onClick={createBusiness} disabled={saving}>
            <Plus size={16} /> {saving ? "Creating..." : "Create business"}
          </button>
        </div>
      </div>}

      {error && <div className="inline-error">{error}</div>}

      {loading ? (
        <div className="table-loading">Loading businesses...</div>
      ) : (
        <div className="business-table directory-table">
          <div className="business-table-head">
            <span>Name</span>
            <span>Industry</span>
            <span>Status</span>
            <span>QRs</span>
            <span>Scans</span>
            <span>Feedback</span>
            <span>Avg rating</span>
            <span>Google</span>
            <span>Created</span>
            <span>Action</span>
          </div>

          {visibleBusinesses.length === 0 ? (
            <div className="business-empty">No businesses yet. Create the first one above.</div>
          ) : (
            visibleBusinesses.map((business) => (
              <div className="business-row" key={business.id}>
                <div className="business-name-block">
                  <strong>{business.name}</strong>
                  {business.googleReviewUrl ? <small>{business.googleReviewUrl}</small> : <small>No Google destination</small>}
                </div>
                <span><b>{business.industryName ?? "Uncategorized"}</b><small>{business.subcategoryName ?? business.location ?? "Location pending"}</small></span>
                <span className={`status-pill ${business.status}`}>{business.status}</span>
                <span>{business.qrCount}</span>
                <span>{business.scanCount}</span>
                <span>{business.feedbackCount}</span>
                <span>{business.averageRating !== null ? business.averageRating.toFixed(1) : "—"}</span>
                <span className={business.googleReviewUrl ? "destination-ready" : "destination-missing"}>{business.googleReviewUrl ? "Configured" : "Not configured"}</span>
                <span>{new Date(business.createdAt).toLocaleDateString()}</span>
                <button className="text-action" onClick={() => void openBusiness(business.id)}>Open <ChevronRight size={14} /></button>
              </div>
            ))
          )}
        </div>
      )}
      {selected && <BusinessDetailModal business={selected} industries={industries} onClose={() => setSelected(null)} onChanged={async () => { await load(); await openBusiness(selected.id); }} />}
    </div>
  );
}

function BusinessDetailModal({ business, industries, onClose, onChanged }: { business: BusinessDetail; industries: IndustryOption[]; onClose: () => void; onChanged: () => Promise<void> }) {
  const [name, setName] = useState(business.name);
  const [location, setLocation] = useState(business.location ?? "");
  const [status, setStatus] = useState(business.status);
  const [industryId, setIndustryId] = useState(business.industryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(business.subcategoryId ?? "");
  const [destination, setDestination] = useState(business.googleDestination?.reviewUrl ?? "");
  const [subscriptionStartAt, setSubscriptionStartAt] = useState(new Date().toISOString().slice(0, 10));
  const [subscriptionEndAt, setSubscriptionEndAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = async (url: string, options: RequestInit, success: string) => {
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch(url, options);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed");
      setMessage(success);
      await onChanged();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return false;
    } finally { setBusy(false); }
  };

  const saveBusiness = async () => { if (await request(`/api/businesses/${business.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, location, status, industryId: industryId || null, subcategoryId: subcategoryId || null }) }, "Business updated")) onClose(); };
  const saveDestination = () => request(`/api/businesses/${business.id}/google-destination`, { method: business.googleDestination ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewUrl: destination }) }, "Google destination updated");
  const generateQr = () => request("/api/qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: `${business.name} QR`, businessId: business.id, subscriptionStartAt, subscriptionEndAt: subscriptionEndAt || null }) }, "QR created and assigned");
  const deleteBusiness = async () => {
    if (!confirm("Permanently delete this business and all of its QR codes, scans, feedback, and history? This cannot be undone.")) return;
    if (await request(`/api/businesses/${business.id}`, { method: "DELETE" }, "Business permanently deleted")) onClose();
  };

  const unassign = (qrCode: string) => {
    if (!confirm("Unassign this QR code from the business?")) return;
    return request(`/api/qr/${qrCode}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: null, status: "inactive" }) }, "QR unassigned");
  };

  const deleteQr = (qrCode: string) => {
    if (!confirm("Delete this QR code? It will be retired and removed from this business.")) return;
    return request(`/api/qr/${qrCode}`, { method: "DELETE" }, "QR deleted");
  };

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="business-detail-modal" role="dialog" aria-modal="true" aria-labelledby="business-detail-title">
      <button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
      <p className="panel-kicker">BUSINESS DETAIL</p><h2 id="business-detail-title">{business.name}</h2>
      {message && <div className="inline-success">{message}</div>}{error && <div className="inline-error">{error}</div>}
      <div className="detail-section"><h3>Business information</h3><div className="detail-form">
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Location<input value={location} onChange={(event) => setLocation(event.target.value)} /></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value as BusinessDetail["status"])}><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></label><label>Industry<select value={industryId} onChange={(event) => { setIndustryId(event.target.value); setSubcategoryId(""); }}><option value="">Select industry</option>{industries.filter((industry) => industry.isActive).map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}</select></label><label>Subcategory<select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)} disabled={!industryId}><option value="">Select subcategory</option>{(industries.find((industry) => industry.id === industryId)?.subcategories ?? []).filter((subcategory) => subcategory.isActive).map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</select></label><span className="detail-date">Created {new Date(business.createdAt).toLocaleDateString()}</span>
      </div><div className="detail-actions"><button className="primary-admin-button" onClick={saveBusiness} disabled={busy}>Save business</button><button className="danger-admin-button" onClick={() => void deleteBusiness()} disabled={busy}><Trash2 size={14} /> Delete business</button></div></div>
      <div className="detail-metrics"><Metric label="QR codes" value={String(business.qrCount)} change="Current" icon={<QrCode />} /><Metric label="Scans" value={String(business.scanCount)} change="Total" icon={<BarChart3 />} /><Metric label="Feedback" value={String(business.feedbackCount)} change="Total" icon={<MessageSquareText />} /><Metric label="Avg rating" value={business.averageRating?.toFixed(1) ?? "—"} change="Live" icon={<Star />} accent="gold" /></div>
      <div className="detail-section"><h3>Google destination</h3><p className="detail-current">{business.googleDestination ? business.googleDestination.reviewUrl : "No Google review destination configured."}</p><div className="destination-editor"><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="https://g.page/..." /><button className="secondary-admin-button" onClick={saveDestination} disabled={busy}>{business.googleDestination ? "Change destination" : "Configure destination"}</button></div><h4>Destination history</h4><div className="history-list">{business.destinationHistory.length === 0 ? <p className="muted-copy">No destination history.</p> : business.destinationHistory.map((item) => <div className="history-row" key={item.id}><span>{item.reviewUrl}</span><small>{new Date(item.createdAt).toLocaleDateString()} · {item.isCurrent ? "Current" : "Previous"}</small></div>)}</div></div>
      <div className="detail-section"><div className="detail-heading"><div><h3>Assigned QRs</h3><p className="muted-copy">Set the subscription period before generating a QR.</p></div><button className="secondary-admin-button" onClick={generateQr} disabled={busy}><Plus size={14} /> Generate QR</button></div><div className="subscription-fields"><label>Starts<input type="date" value={subscriptionStartAt} onChange={(event) => setSubscriptionStartAt(event.target.value)} /></label><label>Ends<input type="date" value={subscriptionEndAt} onChange={(event) => setSubscriptionEndAt(event.target.value)} /></label></div>{business.assignedQrs.length === 0 ? <p className="muted-copy">No QRs currently assigned.</p> : <div className="assigned-qr-list">{business.assignedQrs.map((qr) => <div className="assigned-qr-row" key={qr.qrCode}><QrPreview url={qr.dynamicUrl} label={qr.qrCode} /><span className="assigned-qr-info"><b>{qr.qrCode}</b><small>{qr.label || "Unlabelled"} · {qr.status} · {qr.scanCount} scans · Last scan: {qr.lastScannedAt ? new Date(qr.lastScannedAt).toLocaleDateString() : "Never"} · Subscription: {qr.subscriptionEndAt ? `ends ${new Date(qr.subscriptionEndAt).toLocaleDateString()}` : "ongoing"}</small></span><span className="qr-actions"><button onClick={() => window.open(qr.dynamicUrl, "_blank")} title="View QR"><ChevronRight size={15} /></button><button onClick={async () => { const dataUrl = await QRCode.toDataURL(qr.dynamicUrl, { errorCorrectionLevel: "H", margin: 4, width: 720 }); const link = document.createElement("a"); link.href = dataUrl; link.download = `${qr.qrCode}.png`; link.click(); }} title="Download QR"><Download size={15} /></button><button onClick={() => void unassign(qr.qrCode)} title="Unassign QR"><X size={15} /></button><button onClick={() => void deleteQr(qr.qrCode)} title="Delete QR"><Trash2 size={15} /></button></span></div>)}</div>}</div>
    </section>
  </div>;
}

function QrPreview({ url, label, onClick, large = false }: { url: string; label: string; onClick?: () => void; large?: boolean }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(url, { errorCorrectionLevel: "H", margin: 2, width: 96 }).then((value) => {
      if (active) setDataUrl(value);
    });
    return () => { active = false; };
  }, [url]);

  const content = dataUrl ? <Image className={`assigned-qr-preview${large ? " large-qr-preview" : ""}`} src={dataUrl} width={large ? 320 : 64} height={large ? 320 : 64} unoptimized alt={`QR code ${label}`} /> : <span className="assigned-qr-preview loading-qr">QR</span>;
  return onClick ? <button className="qr-preview-button" onClick={onClick} title={`Open ${label} QR preview`}>{content}</button> : content;
}

function QrCodes() {
  const [qrCodes, setQrCodes] = useState<AdminQr[]>([]);
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [bulkCount, setBulkCount] = useState(1);
  const [bulkBusinessId, setBulkBusinessId] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [previewQr, setPreviewQr] = useState<AdminQr | null>(null);

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/qr");
    const payload = await response.json();
    setQrCodes(payload.qrCodes ?? []);
    setBusinesses(payload.businesses ?? []);
    setLoading(false);
  };

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      const response = await fetch("/api/qr");
      const payload = await response.json();
      if (!ignore) {
        setQrCodes(payload.qrCodes ?? []);
        setBusinesses(payload.businesses ?? []);
        setLoading(false);
      }
    };
    void loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const update = async (qrCode: string, updates: { businessId?: string | null; status?: "active" | "inactive"; subscriptionStartAt?: string; subscriptionEndAt?: string | null }) => {
    await fetch(`/api/qr/${qrCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await load();
  };

  const download = async (qr: AdminQr) => {
    const dataUrl = await QRCode.toDataURL(qr.dynamicUrl, { errorCorrectionLevel: "H", margin: 4, width: 720 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${qr.qrCode}.png`;
    link.click();
  };

  const toggleSelected = (qrCode: string) => setSelectedCodes((current) => current.includes(qrCode) ? current.filter((code) => code !== qrCode) : [...current, qrCode]);
  const toggleAll = () => setSelectedCodes(selectedCodes.length === qrCodes.length ? [] : qrCodes.map((qr) => qr.qrCode));

  const bulkGenerate = async () => {
    const count = Math.max(1, Math.min(100, Math.floor(bulkCount)));
    setBulkBusy(true);
    try {
      for (let index = 0; index < count; index += 1) {
        const response = await fetch("/api/qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: label.trim() ? `${label.trim()} ${index + 1}` : undefined, businessId: bulkBusinessId || null }) });
        if (!response.ok) throw new Error("Unable to generate QR batch");
      }
      setLabel("");
      await load();
    } finally { setBulkBusy(false); }
  };

  const bulkDelete = async () => {
    if (!selectedCodes.length || !confirm(`Delete ${selectedCodes.length} selected QR code${selectedCodes.length === 1 ? "" : "s"}? They will be retired.`)) return;
    setBulkBusy(true);
    try {
      await Promise.all(selectedCodes.map((qrCode) => fetch(`/api/qr/${qrCode}`, { method: "DELETE" })));
      setSelectedCodes([]);
      await load();
    } finally { setBulkBusy(false); }
  };

  return (
    <div className="dashboard-content qr-manager">
      <div className="admin-page-heading">
        <div>
          <p className="panel-kicker">DYNAMIC QR CODES</p>
          <h2>Connect printed codes to live review flows</h2>
        </div>
        <div className="qr-create">
          <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Label, e.g. Reception" />
          <input className="qr-bulk-count" type="number" min="1" max="100" value={bulkCount} onChange={(event) => setBulkCount(Number(event.target.value))} aria-label="Number of QRs" />
          <select className="qr-bulk-business" value={bulkBusinessId} onChange={(event) => setBulkBusinessId(event.target.value)} aria-label="Assign generated QRs to business"><option value="">Unassigned</option>{businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select>
          <button className="primary-admin-button" onClick={() => void bulkGenerate()} disabled={bulkBusy}><Plus size={16} /> {bulkCount > 1 ? "Generate batch" : "Create QR"}</button>
        </div>
      </div>

      <p className="section-copy">Every QR encodes only its permanent Kindred URL. Reassigning a code changes its destination without reprinting.</p>

      {selectedCodes.length > 0 && <div className="bulk-qr-toolbar"><strong>{selectedCodes.length} selected</strong><button className="danger-admin-button" onClick={() => void bulkDelete()} disabled={bulkBusy}><Trash2 size={14} /> Delete selected</button></div>}

      {loading ? (
        <p>Loading QR codes...</p>
      ) : (
        <div className="qr-table">
          <div className="qr-table-head">
            <span><input type="checkbox" checked={qrCodes.length > 0 && selectedCodes.length === qrCodes.length} onChange={toggleAll} aria-label="Select all QR codes" /></span>
            <span>Preview</span>
            <span>QR code</span>
            <span>Business</span>
            <span>Subscription ends</span>
            <span>Status</span>
            <span>Scans</span>
            <span>Actions</span>
          </div>

          {qrCodes.length === 0 ? (
            <div className="qr-empty">No QR codes yet. Create one to begin.</div>
          ) : (
            qrCodes.map((qr) => (
              <div className="qr-row" key={qr.qrCode}>
                <span><input type="checkbox" checked={selectedCodes.includes(qr.qrCode)} onChange={() => toggleSelected(qr.qrCode)} aria-label={`Select ${qr.qrCode}`} /></span>
                <QrPreview url={qr.dynamicUrl} label={qr.qrCode} onClick={() => setPreviewQr(qr)} />
                <div>
                  <b>{qr.qrCode}</b>
                  <small>{qr.label || "Unlabelled"}</small>
                </div>
                <select value={qr.business?.id || ""} onChange={(event) => update(qr.qrCode, { businessId: event.target.value || null, status: event.target.value ? "active" : "inactive" })}>
                  <option value="">Unassigned</option>
                  {businesses.map((business) => (
                    <option value={business.id} key={business.id}>{business.name}</option>
                  ))}
                </select>
                <input className="qr-subscription-date" type="date" value={qr.subscriptionEndAt?.slice(0, 10) ?? ""} disabled={!qr.business} onChange={(event) => void update(qr.qrCode, { subscriptionEndAt: event.target.value || null })} />
                <button className={`qr-status ${qr.status}`} onClick={() => update(qr.qrCode, { status: qr.status === "active" ? "inactive" : "active" })}>{qr.status}</button>
                <strong>{qr.scanCount}</strong>
                <div className="qr-actions">
                  <button onClick={() => void download(qr)} title="Download QR"><Download size={15} /></button>
                  <button onClick={() => navigator.clipboard.writeText(qr.dynamicUrl)} title="Copy permanent URL">Copy URL</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {previewQr && <div className="qr-image-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewQr(null); }}>
        <section className="qr-image-modal" role="dialog" aria-modal="true" aria-label={`QR code ${previewQr.qrCode}`}>
          <button className="modal-close" onClick={() => setPreviewQr(null)} aria-label="Close QR preview"><X size={20} /></button>
          <p className="panel-kicker">QR PREVIEW</p>
          <h3>{previewQr.qrCode}</h3>
          <QrPreview url={previewQr.dynamicUrl} label={previewQr.qrCode} large />
          <p>{previewQr.dynamicUrl}</p>
          <button className="primary-admin-button" onClick={() => void download(previewQr)}><Download size={15} /> Download image</button>
        </section>
      </div>}
    </div>
  );
}
