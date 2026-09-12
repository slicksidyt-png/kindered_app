"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { BookOpen, Check, Copy, Download, MoreHorizontal, Plus, ToggleLeft } from "lucide-react";

type Industry = { id: string; name: string; isActive: boolean; subcategories: Array<{ id: string; name: string; isActive: boolean }> };
type Plan = { id: string; name: string; durationType: string; durationValue: number; price: string | number; isActive: boolean };
type SuperQr = { publicToken: string; dynamicUrl: string; label: string | null; isActive: boolean; _count: { scans: number } };

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}

export default function PlatformManagement({ section }: { section: string }) {
  if (section === "Industries") return <IndustryManager />;
  if (section === "Questionnaire") return <QuestionManager />;
  if (section === "Knowledge Base") return <KnowledgeManager />;
  if (section === "Subscriptions") return <SubscriptionManager />;
  if (section === "Super QR") return <SuperQrManager />;
  return null;
}

function ManagementFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="dashboard-content"><div className="admin-page-heading"><div><p className="panel-kicker">PLATFORM MANAGEMENT</p><h2>{title}</h2></div></div>{children}</div>;
}

function IndustryManager() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [name, setName] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [error, setError] = useState("");
  const load = () => requestJson("/api/admin/industries").then((data) => setIndustries(data.industries ?? [])).catch((err) => setError(err.message));
  useEffect(() => { void load(); }, []);
  const addIndustry = async () => { try { await requestJson("/api/admin/industries", { method: "POST", body: JSON.stringify({ name }) }); setName(""); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to save industry"); } };
  const addSubcategory = async () => { try { await requestJson("/api/admin/subcategories", { method: "POST", body: JSON.stringify({ industryId: selectedIndustry, name: subcategory }) }); setSubcategory(""); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to save subcategory"); } };
  return <ManagementFrame title="Industries & subcategories"><div className="dashboard-grid"><section className="panel"><h2>Add industry</h2><div className="qr-create"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Salon & Beauty" /><button className="primary-admin-button" onClick={() => void addIndustry()}><Plus size={15} /> Add</button></div><h2 className="management-subheading">Add subcategory</h2><div className="qr-create"><select value={selectedIndustry} onChange={(event) => setSelectedIndustry(event.target.value)}><option value="">Select industry</option>{industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}</select><input value={subcategory} onChange={(event) => setSubcategory(event.target.value)} placeholder="Men's Salon" /><button className="primary-admin-button" disabled={!selectedIndustry || !subcategory} onClick={() => void addSubcategory()}><Plus size={15} /> Add</button></div>{error && <p className="login-error">{error}</p>}</section><section className="panel"><h2>Current taxonomy</h2><div className="management-list">{industries.map((industry) => <div className="management-row" key={industry.id}><div><b>{industry.name}</b><small>{industry.isActive ? "Active" : "Inactive"}</small></div><span>{industry.subcategories.map((item) => item.name).join(", ") || "No subcategories yet"}</span></div>)}</div></section></div></ManagementFrame>;
}

function QuestionManager() {
  const [questions, setQuestions] = useState<Array<{ id: string; text: string; scope: string; type: string; isActive: boolean; options: Array<{ id: string; label: string }> }>>([]);
  const [industries, setIndustries] = useState<Array<{ id: string; name: string; subcategories: Array<{ id: string; name: string }> }>>([]);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({ text: "", scope: "GLOBAL", type: "TEXT", industryId: "", subcategoryId: "", businessId: "", keywords: "", options: "", applicableStarRatings: [1, 2, 3, 4, 5] });
  const [error, setError] = useState("");
  const [questionFilter, setQuestionFilter] = useState("ALL");

  const load = async () => {
    try {
      const [questionsData, industriesData, businessesData] = await Promise.all([
        requestJson("/api/admin/questions"),
        requestJson("/api/admin/industries"),
        requestJson("/api/businesses"),
      ]);
      setQuestions(questionsData.questions ?? []);
      setIndustries(industriesData.industries ?? []);
      setBusinesses(businessesData.businesses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load question data");
    }
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    try {
      const options = form.options.split(",").map((value) => value.trim()).filter(Boolean).map((label) => ({ label, value: label }));
      const payload = {
        ...form,
        industryId: form.scope === "INDUSTRY" ? form.industryId || null : null,
        subcategoryId: form.scope === "SUBCATEGORY" ? form.subcategoryId || null : null,
        businessId: form.scope === "BUSINESS" ? form.businessId || null : null,
        keywords: form.keywords.split(",").map((value) => value.trim()).filter(Boolean),
        options,
      };
      await requestJson("/api/admin/questions", { method: "POST", body: JSON.stringify(payload) });
      setForm({ text: "", scope: "GLOBAL", type: "TEXT", industryId: "", subcategoryId: "", businessId: "", keywords: "", options: "", applicableStarRatings: [1, 2, 3, 4, 5] });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save question");
    }
  };

  const filteredQuestions = questionFilter === "ALL" ? questions : questions.filter((question) => question.type === questionFilter);
  const filters = ["ALL", "STAR_RATING", "RATING", "SINGLE_CHOICE", "TEXT"];
  const selectedIndustrySubcategories = industries.find((industry) => industry.id === form.industryId)?.subcategories ?? [];
  const toggleRating = (value: number) => setForm((current) => ({
    ...current,
    applicableStarRatings: current.applicableStarRatings.includes(value)
      ? current.applicableStarRatings.filter((rating) => rating !== value)
      : [...current.applicableStarRatings, value].sort((left, right) => left - right),
  }));

  return <ManagementFrame title="Question bank"><div className="question-toolbar"><div><p className="panel-kicker">CUSTOMER QUESTIONNAIRE</p><h2>Questions <span>{questions.length}</span></h2></div><button className="primary-admin-button" onClick={() => document.getElementById("question-create")?.scrollIntoView({ behavior: "smooth" })}><Plus size={15} /> Add question</button></div><div className="question-tabs">{filters.map((filter) => <button key={filter} className={questionFilter === filter ? "selected" : ""} onClick={() => setQuestionFilter(filter)}>{filter === "ALL" ? "All" : filter.replaceAll("_", " ")}</button>)}</div><section className="panel question-create" id="question-create"><div className="field-grid"><label>Question<input value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} /></label><label>Scope<select value={form.scope} onChange={(event) => { const nextScope = event.target.value; setForm({ ...form, scope: nextScope, industryId: nextScope === "INDUSTRY" ? form.industryId : "", subcategoryId: nextScope === "SUBCATEGORY" ? form.subcategoryId : "", businessId: nextScope === "BUSINESS" ? form.businessId : "" }); }}><option>GLOBAL</option><option>INDUSTRY</option><option>SUBCATEGORY</option><option>BUSINESS</option></select></label><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>TEXT</option><option>SINGLE_CHOICE</option><option>MULTIPLE_CHOICE</option><option>YES_NO</option><option>RATING</option><option>STAR_RATING</option><option>NUMBER</option><option>SCALE</option></select></label>{form.scope === "INDUSTRY" && <label>Industry<select value={form.industryId} onChange={(event) => setForm({ ...form, industryId: event.target.value, subcategoryId: "" })}><option value="">Select industry</option>{industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}</select></label>}{form.scope === "SUBCATEGORY" && <><label>Industry<select value={form.industryId} onChange={(event) => setForm({ ...form, industryId: event.target.value, subcategoryId: "" })}><option value="">Select industry</option>{industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}</select></label><label>Sub-Category<select value={form.subcategoryId} onChange={(event) => setForm({ ...form, subcategoryId: event.target.value })} disabled={!form.industryId}><option value="">Select sub-category</option>{selectedIndustrySubcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</select></label></>}{form.scope === "BUSINESS" && <label>Business<select value={form.businessId} onChange={(event) => setForm({ ...form, businessId: event.target.value })}><option value="">Select business</option>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></label>}<label>Keywords<input value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="clean, hygiene" /></label><label>Options<input value={form.options} onChange={(event) => setForm({ ...form, options: event.target.value })} placeholder="Option A, Option B" /></label></div><div className="field-grid"><label className="wide-field">Applicable star ratings</label><div className="chip-grid">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" className={form.applicableStarRatings.includes(rating) ? "theme-chip active" : "theme-chip"} onClick={() => toggleRating(rating)}>{rating} ★</button>)}</div></div><button className="primary-admin-button" onClick={() => void create()}><Plus size={15} /> Save</button>{error && <p className="login-error">{error}</p>}</section><section className="panel"><div className="management-list">{filteredQuestions.map((question) => <div className="management-row" key={question.id}><div><b>{question.text}</b><small>{question.scope} · {question.type}</small></div><span>{question.isActive ? "Active" : "Inactive"}</span></div>)}</div></section></ManagementFrame>;
}

function KnowledgeManager() {
  const [businessId, setBusinessId] = useState("");
  const [form, setForm] = useState({ title: "", content: "", type: "BUSINESS_INFORMATION" });
  const [message, setMessage] = useState("");
  const save = async () => { try { await requestJson(`/api/admin/knowledge-base/${businessId}`, { method: "POST", body: JSON.stringify(form) }); setMessage("Knowledge entry saved"); setForm({ title: "", content: "", type: "BUSINESS_INFORMATION" }); } catch (err) { setMessage(err instanceof Error ? err.message : "Unable to save knowledge"); } };
  return <ManagementFrame title="Business knowledge base"><section className="panel"><div className="field-grid"><label>Business ID<input value={businessId} onChange={(event) => setBusinessId(event.target.value)} placeholder="Business UUID" /></label><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{["BUSINESS_INFORMATION", "SERVICES", "PRODUCTS", "PRICING", "FAQ", "POLICIES", "OPENING_HOURS", "STAFF", "CONTACT_INFORMATION", "OTHER"].map((type) => <option key={type}>{type}</option>)}</select></label><label className="wide-field">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className="wide-field">Content<textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label></div><button className="primary-admin-button" disabled={!businessId} onClick={() => void save()}><BookOpen size={15} /> Save knowledge</button>{message && <p className="login-error">{message}</p>}</section></ManagementFrame>;
}

function SubscriptionManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ name: "", durationType: "DAY", durationValue: "7", price: "0" });
  const [businessId, setBusinessId] = useState("");
  const [planId, setPlanId] = useState("");
  const load = () => requestJson("/api/admin/subscriptions/plans").then((data) => setPlans(data.plans ?? []));
  useEffect(() => { void load(); }, []);
  const createPlan = async () => { await requestJson("/api/admin/subscriptions/plans", { method: "POST", body: JSON.stringify({ ...form, durationValue: Number(form.durationValue), price: Number(form.price) }) }); setForm({ name: "", durationType: "DAY", durationValue: "7", price: "0" }); await load(); };
  const assign = async (kind: "TRIAL" | "PAID") => { await requestJson("/api/admin/subscriptions", { method: "POST", body: JSON.stringify({ businessId, planId: kind === "PAID" ? planId : undefined, kind }) }); };
  return <ManagementFrame title="Subscriptions"><div className="dashboard-grid"><section className="panel"><h2>Create plan</h2><div className="field-grid"><label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="30 days" /></label><label>Unit<select value={form.durationType} onChange={(event) => setForm({ ...form, durationType: event.target.value })}><option>DAY</option><option>MONTH</option></select></label><label>Duration<input type="number" min="1" value={form.durationValue} onChange={(event) => setForm({ ...form, durationValue: event.target.value })} /></label><label>Price<input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label></div><button className="primary-admin-button" onClick={() => void createPlan()}><Plus size={15} /> Add plan</button><div className="management-list">{plans.map((plan) => <div className="management-row" key={plan.id}><div><b>{plan.name}</b><small>{plan.durationValue} {plan.durationType.toLowerCase()} · {String(plan.price)}</small></div><Check size={18} /></div>)}</div></section><section className="panel"><h2>Assign subscription</h2><label className="field-label">Business ID<input value={businessId} onChange={(event) => setBusinessId(event.target.value)} placeholder="Business UUID" /></label><label className="field-label">Paid plan<select value={planId} onChange={(event) => setPlanId(event.target.value)}><option value="">Select plan</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label><div className="qr-create"><button className="secondary-button" disabled={!businessId} onClick={() => void assign("TRIAL")}>Start 7-day trial</button><button className="primary-admin-button" disabled={!businessId || !planId} onClick={() => void assign("PAID")}>Assign paid plan</button></div></section></div></ManagementFrame>;
}

function SuperQrManager() {
  const [items, setItems] = useState<SuperQr[]>([]);
  const [label, setLabel] = useState("Field demo");
  const load = () => requestJson("/api/admin/super-qr").then((data) => setItems(data.superQrs ?? []));
  useEffect(() => { void load(); }, []);
  const create = async () => { await requestJson("/api/admin/super-qr", { method: "POST", body: JSON.stringify({ label }) }); await load(); };
  const toggle = async (item: SuperQr) => { await requestJson(`/api/admin/super-qr/${item.publicToken}`, { method: "PATCH", body: JSON.stringify({ isActive: !item.isActive }) }); await load(); };
  const download = async (item: SuperQr) => { const dataUrl = await QRCode.toDataURL(item.dynamicUrl, { width: 640, margin: 2 }); const link = document.createElement("a"); link.href = dataUrl; link.download = `${item.publicToken}.png`; link.click(); };
  return <ManagementFrame title="Super QR"><section className="panel"><p className="section-copy">Reusable demonstration QR codes are isolated from production businesses, sessions, subscriptions, and feedback.</p><div className="qr-create"><input value={label} onChange={(event) => setLabel(event.target.value)} /><button className="primary-admin-button" onClick={() => void create()}><Plus size={15} /> Create Super QR</button></div><div className="management-list">{items.map((item) => <div className="management-row" key={item.publicToken}><div><b>{item.label}</b><small>{item.dynamicUrl} · {item._count.scans} scans</small></div><button className="icon-action" aria-label="Toggle Super QR" onClick={() => void toggle(item)}>{item.isActive ? <Check size={16} /> : <ToggleLeft size={18} />}</button><button className="icon-action" aria-label="Copy Super QR URL" onClick={() => void navigator.clipboard?.writeText(item.dynamicUrl)}><Copy size={16} /></button><button className="icon-action" aria-label="Download Super QR" onClick={() => void download(item)}><Download size={16} /></button></div>)}</div></section></ManagementFrame>;
}
