"use client";
import { useState, useEffect, useRef } from "react";
import { Search, AlertTriangle, Lock, Building, Navigation, Trees, ChevronRight, CheckCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DISTRICTS = [
  { value: "1", label: "Λευκωσία (Nicosia)" },
  { value: "3", label: "Αμμόχωστος (Famagusta)" },
  { value: "4", label: "Λάρνακα (Larnaca)" },
  { value: "5", label: "Λεμεσός (Limassol)" },
  { value: "6", label: "Πάφος (Paphos)" },
];

interface Village { code: string; name: string; }
interface DLSFull {
  sbpi: string | number;
  areaGIS: number; areaOfficial: number | null;
  propertyKind: string | null; propertyKindEn: string | null;
  isField: boolean | null; zoneCode: string | null;
  density: number | null; coverage: number | null;
  maxFloors: number | null; maxHeight: number | null;
  generalValuation2021: number | string | null;
  accessType: string | null; shape: string | null;
  deductions: { plan: string; grossArea: number; roadDeduction: number; roadPct: number; greenDeduction: number; greenPct: number; communityDeduction: number; communityPct: number; totalDeduction: number; totalPct: number; netDevelopableArea: number; } | null;
  netArea: number | null;
}

// ─── Custom Village Autocomplete ─────────────────────────────────────────
function VillageSearch({ villages, value, onChange, disabled }: {
  villages: Village[]; value: string;
  onChange: (v: string, code: string) => void; disabled: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length >= 1
    ? villages.filter(v => v.name.toLowerCase().includes(query.toLowerCase())).slice(0, 12)
    : villages.slice(0, 12);

  useEffect(() => { if (!value) setQuery(""); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        type="text"
        className="form-input"
        placeholder={disabled ? "Επιλέξτε επαρχία πρώτα..." : "Πληκτρολογήστε χωριό/δήμο..."}
        disabled={disabled}
        value={query}
        style={{ opacity: disabled ? 0.5 : 1, width: "100%" }}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange("", ""); }}
        onFocus={() => { if (!disabled) setOpen(true); }}
        autoComplete="off"
      />
      {open && !disabled && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1000,
          background: "var(--bg-secondary)", border: "1px solid var(--border-accent)",
          borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", maxHeight: 260, overflowY: "auto",
        }}>
          {filtered.map(v => (
            <button key={v.code} type="button"
              style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-dim)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              onClick={() => { setQuery(v.name); onChange(v.name, v.code); setOpen(false); }}
            >
              <span>{v.name}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>{v.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: "var(--bg-secondary)", border: `1px solid ${accent ? "var(--border-accent)" : "var(--border)"}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: accent ? "var(--accent)" : "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

// ─── Module Header ─────────────────────────────────────────────────────────
function ModuleHeader({ icon, title, color = "var(--accent)", badge }: { icon: React.ReactNode; title: string; color?: string; badge?: string }) {
  return (
    <div style={{ background: `color-mix(in srgb, ${color} 8%, transparent)`, borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color }}>{icon}</span>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
      </div>
      {badge && <span style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>{badge}</span>}
    </div>
  );
}

export default function FeasibilityPage() {
  const [district, setDistrict] = useState("");
  const [villages, setVillages] = useState<Village[]>([]);
  const [villagesLoading, setVillagesLoading] = useState(false);
  const [villageName, setVillageName] = useState("");
  const [villageCode, setVillageCode] = useState("");
  const [parcel, setParcel] = useState("");
  const [quarter, setQuarter] = useState("");
  const [block, setBlock] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState<DLSFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!district) { setVillages([]); setVillageName(""); setVillageCode(""); return; }
    setVillagesLoading(true);
    fetch(`${API_URL}/api/dls/villages/${district}`)
      .then(r => r.json())
      .then(d => { setVillages(d.villages || []); setVillagesLoading(false); })
      .catch(() => { setVillages([]); setVillagesLoading(false); });
  }, [district]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageCode) { setError("Παρακαλώ επιλέξτε χωριό/δήμο από τη λίστα."); return; }
    setError(null); setResult(null); setLoading(true);
    try {
      setLoadingStep("Αναζήτηση τεμαχίου...");
      const s = await fetch(`${API_URL}/api/dls/search-parcel?dist_code=${district}&vil_code=${villageCode}&parcel_no=${parcel}&block_no=${block}&quarter=${quarter}`).then(r => r.json());
      if (!s.found) { setError("Δεν βρέθηκε το τεμάχιο. Ελέγξτε τα στοιχεία."); setLoading(false); return; }
      setLoadingStep("Φόρτωση ζώνης & αξίας από DLS...");
      // Use real SBPI (SBPI_ID_NO) for DLS service calls; fall back to OBJECTID
      const sbpiId = s.sbpi ? Math.round(s.sbpi) : s.objectid;
      const full = await fetch(`${API_URL}/api/dls/full-parcel/${sbpiId}?dist_code=${district}&area_gis=${s.area_gis || 0}`).then(r => r.json());
      setResult(full);
    } catch { setError("Σφάλμα επικοινωνίας με το Κτηματολόγιο."); }
    finally { setLoading(false); setLoadingStep(""); }
  };

  const d = result?.deductions;
  const area = result ? (result.areaOfficial || result.areaGIS || 0) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>

      {/* Header */}
      <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", padding: "36px 0 28px" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 8px var(--success)", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, letterSpacing: "0.05em" }}>LIVE · DLS REST API</span>
          </div>
          <h1 style={{ fontSize: "clamp(22px, 3vw, 32px)", marginBottom: 6 }}>CyprusAVM Feasibility Engine</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Επίσημα κτηματολογιακά δεδομένα σε πραγματικό χρόνο · Ζώνες · Αποκοπές · Αξία 2021
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* MODULE 1: SEARCH */}
          <div className="card" style={{ overflow: "hidden" }}>
            <ModuleHeader icon={<Search size={16} />} title="Module 1 — Αναζήτηση Τεμαχίου (DLS Cadastral Search)" />
            <div style={{ padding: 24 }}>
              <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* District */}
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Επαρχία (District) *</label>
                    <select value={district} onChange={e => { setDistrict(e.target.value); setResult(null); setError(null); }} required className="form-select">
                      <option value="">Επιλογή επαρχίας...</option>
                      {DISTRICTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Δήμος / Χωριό *{" "}
                      {villagesLoading && <span style={{ color: "var(--accent)", fontSize: 11 }}>φόρτωση...</span>}
                      {villages.length > 0 && !villagesLoading && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({villages.length} διαθέσιμα)</span>}
                    </label>
                    <VillageSearch
                      villages={villages}
                      value={villageName}
                      disabled={!district || villagesLoading}
                      onChange={(name, code) => { setVillageName(name); setVillageCode(code); }}
                    />
                    {villageCode && (
                      <div style={{ fontSize: 11, color: "var(--success)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle size={11} /> {villageName} <span style={{ color: "var(--text-muted)" }}>(κωδ. {villageCode})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parcel / Quarter / Block */}
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Αρ. Τεμαχίου *</label>
                    <input type="text" value={parcel} onChange={e => setParcel(e.target.value)} required placeholder="π.χ. 57" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ενορία (Quarter)</label>
                    <input type="text" value={quarter} onChange={e => setQuarter(e.target.value)} placeholder="π.χ. 4" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Τμήμα (Block)</label>
                    <input type="text" value={block} onChange={e => setBlock(e.target.value)} placeholder="π.χ. 0" className="form-input" />
                  </div>
                </div>

                {error && (
                  <div style={{ padding: "12px 16px", background: "var(--error-dim)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 8, color: "var(--error)", fontSize: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />{error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontSize: 15, padding: "14px" }}>
                  {loading
                    ? <><span className="spinner" />{loadingStep}</>
                    : <><Search size={17} />Αναζήτηση στο Κτηματολόγιο</>}
                </button>
              </form>
            </div>
          </div>

          {/* RESULTS */}
          {result && (
            <>
              {/* Parcel Identity */}
              <div className="card" style={{ overflow: "hidden" }}>
                <ModuleHeader icon={<Building size={16} />} title="Ταυτότητα Τεμαχίου" />
                <div style={{ padding: 20 }}>
                  <div className="grid-4" style={{ marginBottom: 14 }}>
                    <StatCard label="SBPI" value={String(result.sbpi)} />
                    <StatCard label="Είδος" value={result.propertyKindEn || result.propertyKind || "—"} accent={result.isField === false} />
                    <StatCard label="Εμβαδόν GIS" value={area > 0 ? `${Math.round(area).toLocaleString("el-GR")} m²` : "—"} />
                    <StatCard label="Επίσημο DLS" value={result.areaOfficial ? `${Math.round(result.areaOfficial).toLocaleString("el-GR")} m²` : "—"} />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {result.isField === false && <span className="badge badge-success"><CheckCircle size={11} /> Οικόπεδο — Άμεσα Αναπτύξιμο</span>}
                    {result.isField === true && <span className="badge badge-gold"><AlertTriangle size={11} /> Χωράφι — Απαιτείται Υποδιαίρεση</span>}
                    {result.accessType && <span className="badge badge-accent">Πρόσβαση: {result.accessType}</span>}
                    {result.shape && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 100, background: "var(--bg-glass)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Σχήμα: {result.shape}</span>}
                  </div>
                </div>
              </div>

              {/* MODULE 2: ZONE + DEDUCTIONS */}
              <div className="card" style={{ overflow: "hidden" }}>
                <ModuleHeader icon={<Building size={16} />} title="Module 2 — Παράμετροι Ζώνης & Αποκοπές" color="#0EA5E9" />
                <div style={{ padding: 20 }}>
                  <div className="grid-4" style={{ marginBottom: 20 }}>
                    <StatCard label="Ζώνη" value={result.zoneCode || "—"} accent={!!result.zoneCode} />
                    <StatCard label="Συντ. Δόμησης" value={result.density != null ? `${(Number(result.density) * 100).toFixed(0)}%` : "—"} />
                    <StatCard label="Κάλυψη" value={result.coverage != null ? `${(Number(result.coverage) * 100).toFixed(0)}%` : "—"} />
                    <StatCard label="Όροφοι / Ύψος" value={`${result.maxFloors ?? "—"} / ${result.maxHeight != null ? result.maxHeight + "m" : "—"}`} />
                  </div>

                  {d && (
                    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", justifyContent: "space-between" }}>
                        <span>Land Deductions — {d.plan}</span>
                        <span style={{ color: "var(--error)" }}>Σύνολο: −{d.totalPct}%</span>
                      </div>
                      {[
                        { label: `Μεικτό Εμβαδόν`, value: `${d.grossArea.toLocaleString("el-GR")} m²`, color: "var(--text-primary)", icon: null, bold: true },
                        { label: `Οδικό Δίκτυο (${d.roadPct}%)`, value: `− ${d.roadDeduction.toLocaleString("el-GR")} m²`, color: "var(--error)", icon: <Navigation size={12} />, bold: false },
                        { label: `Πράσινοι Χώροι (${d.greenPct}%)`, value: `− ${d.greenDeduction.toLocaleString("el-GR")} m²`, color: "var(--error)", icon: <Trees size={12} />, bold: false },
                        ...(d.communityPct > 0 ? [{ label: `Κοινοτικές Παροχές (${d.communityPct}%)`, value: `− ${d.communityDeduction.toLocaleString("el-GR")} m²`, color: "var(--error)", icon: <Building size={12} />, bold: false }] : []),
                        { label: "Καθαρό Αναπτύξιμο Εμβαδόν", value: `${d.netDevelopableArea.toLocaleString("el-GR")} m²`, color: "var(--success)", icon: <ChevronRight size={12} />, bold: true },
                      ].map((row, i, arr) => (
                        <div key={i} style={{ padding: "11px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: i > 0 ? "1px solid var(--border)" : undefined, background: i === arr.length - 1 ? "rgba(16,185,129,0.06)" : undefined }}>
                          <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                            {row.icon && <span style={{ color: row.color }}>{row.icon}</span>}{row.label}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: row.bold ? 800 : 600, color: row.color, fontFamily: "DM Mono, monospace" }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* MODULE 3: 3D Massing — Coming Soon */}
              <div className="card" style={{ overflow: "hidden", opacity: 0.8 }}>
                <ModuleHeader icon={<Building size={16} />} title="Module 3 — 3D Building Massing" color="#6366F1" badge="Coming Soon" />
                <div style={{ padding: 24, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, background: "rgba(8,12,24,0.78)", backdropFilter: "blur(4px)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Lock size={26} color="var(--text-muted)" />
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Επόμενη φάση — Building Massing + Unit Mix</p>
                  </div>
                  <div style={{ height: 110, background: "var(--bg-secondary)", borderRadius: 10, border: "1px dashed var(--border)" }} />
                </div>
              </div>

              {/* MODULE 7: DLS VALUATION */}
              <div className="card card-glow" style={{ overflow: "hidden" }}>
                <ModuleHeader icon={<Building size={16} />} title="Module 7 — Επίσημη Αξία Κτηματολογίου (Γενική Εκτίμηση DLS)" color="var(--success)" />
                <div style={{ padding: 28, textAlign: "center" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>ΑΞΙΑ ΚΤΗΜΑΤΟΛΟΓΙΟΥ — 1.1.2021</p>
                  <div className="text-gradient" style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 14 }}>
                    {result.generalValuation2021 != null
                      ? typeof result.generalValuation2021 === "number"
                        ? `€${result.generalValuation2021.toLocaleString("el-GR")}`
                        : result.generalValuation2021
                      : "Δεν διατίθεται από DLS"}
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,.3)", border: "1px solid var(--border)", padding: "5px 14px", borderRadius: 100, fontSize: 12, color: "var(--text-secondary)" }}>
                      {result.propertyKind || "Ακίνητο"} · SBPI: {result.sbpi}
                    </span>
                    {area > 0 && typeof result.generalValuation2021 === "number" && result.generalValuation2021 > 0 && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(45,212,191,.1)", border: "1px solid var(--border-accent)", padding: "5px 14px", borderRadius: 100, fontSize: 12, color: "var(--accent)" }}>
                        ≈ €{Math.round(result.generalValuation2021 / area).toLocaleString("el-GR")}/m²
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
                    Κτηματολογιακή αξία κράτους — δεν αντικατοπτρίζει απαραίτητα την τρέχουσα εμπορική αξία.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
