"use client";
import { useState, useEffect, useCallback } from "react";
import {
  estimateProperty,
  getComparables,
  type PropertyInput,
  type ValuationResult,
  type ComparableProperty,
  formatEuro,
} from "@/lib/api";
import { Printer } from "lucide-react";
const DISTRICTS = [
  { value: "lemesos", label: "Λεμεσός" },
  { value: "lefkosia", label: "Λευκωσία" },
  { value: "larnaka", label: "Λάρνακα" },
  { value: "pafos", label: "Πάφος" },
  { value: "ammochostos", label: "Αμμόχωστος" },
];

const MUNICIPALITIES: Record<string, string[]> = {
  lemesos: [
    "Agía Zóni", "Germasogeia", "Mesa Geitonia", "Mouttagiaka",
    "Kato Polemidia", "Ypsonas", "Potamos Germasogeias",
    "Agios Tychonas", "Zakaki", "Polemidia", "Pyrgos", "Episkopi",
  ],
  lefkosia: ["Engomi", "Strovolos", "Lakatamia", "Nicosia Old Town"],
  larnaka: ["Finikoudes", "Drosia", "Aradippou"],
  pafos: ["Kato Paphos", "Chloraka", "Yeroskipou"],
  ammochostos: ["Paralimni", "Protaras", "Ayia Napa", "Sotira"],
};

const PROPERTY_TYPES = [
  { value: "apartment", label: "Διαμέρισμα" },
  { value: "house", label: "Κατοικία" },
  { value: "villa", label: "Βίλα" },
  { value: "land", label: "Οικόπεδο" },
];

const DEFAULT_FORM: PropertyInput = {
  area_sqm: 85,
  bedrooms: 2,
  bathrooms: 1,
  district: "lemesos",
  municipality: "Agía Zóni",
  property_type: "apartment",
  listing_type: "resale",
  year_built: undefined,
  floor: undefined,
  has_parking: false,
  has_sea_view: false,
  has_pool: false,
  has_garden: false,
  has_title_deed: true,
};

function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return value;
}

function ConfidenceMeter({ pct, label }: { pct: number; label: string }) {
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setFilled(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  const color =
    label === "high" ? "var(--success)" : label === "medium" ? "var(--gold)" : "var(--error)";
  const text = label === "high" ? "Υψηλή" : label === "medium" ? "Μέτρια" : "Χαμηλή";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Εμπιστοσύνη εκτίμησης</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>
          {text} · {pct}%
        </span>
      </div>
      <div className="confidence-bar">
        <div
          style={{
            height: "100%",
            width: `${filled}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            borderRadius: 100,
            transition: "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </div>
    </div>
  );
}

function ResultCard({
  result,
  comparables,
  area_sqm,
  address,
}: {
  result: ValuationResult;
  comparables: ComparableProperty[];
  area_sqm: number;
  address: string;
}) {
  const animatedEstimate = useCounter(result.estimate, 1000);
  const priceSqmDiff = ((result.price_per_sqm - result.area_median_price_sqm) / result.area_median_price_sqm) * 100;
  const today = new Date().toLocaleDateString("el-GR");

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div id="pdf-report-content" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px", background: "var(--bg-primary)", borderRadius: "var(--radius-lg)" }}>
        {/* Report Header */}
        <div style={{ paddingBottom: 16, borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Cyprus<span style={{ color: "var(--accent)" }}>AVM</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                Αυτόματη Εκτίμηση Ακινήτου
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, color: "var(--text-muted)" }}>
              <div>Ημερομηνία: {today}</div>
              {address && <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>{address}</div>}
            </div>
          </div>
        </div>

      {/* Main estimate card */}
      <div className="card card-glow" style={{ padding: 32 }}>
        <div style={{ marginBottom: 4, fontSize: 12, color: "var(--text-muted)" }}>
          Εκτιμώμενη Αξία
        </div>
        <div
          className="text-gradient"
          style={{
            fontSize: "clamp(36px, 5vw, 52px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          {formatEuro(animatedEstimate)}
        </div>
        <div style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24 }}>
          {formatEuro(result.range_low)} — {formatEuro(result.range_high)}
        </div>

        <ConfidenceMeter pct={result.confidence_pct} label={result.confidence} />
      </div>

      {/* Price/sqm comparison */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Η Τιμή σου / τμ
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            €{result.price_per_sqm.toLocaleString("el-GR")}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Μέση Περιοχής / τμ
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800 }}>
              €{result.area_median_price_sqm.toLocaleString("el-GR")}
            </span>
            <span
              className={`badge ${priceSqmDiff >= 0 ? "badge-success" : "badge-error"}`}
              style={{ fontSize: 11 }}
            >
              {priceSqmDiff > 0 ? "+" : ""}{priceSqmDiff.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Comparables count */}
      <div
        className="card"
        style={{
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--accent-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          📊
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            Βασίστηκε σε{" "}
            <span style={{ color: "var(--accent)" }}>
              {result.comparable_count}
            </span>{" "}
            παρόμοιες αγοραπωλησίες
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Τελευταίοι 24 μήνες · Ίδια περιοχή · ±35% επιφάνεια
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      {(result.factors_positive.length > 0 || result.factors_negative.length > 0) && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Ανάλυση Παραγόντων
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.factors_positive.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "10px 14px",
                  background: "var(--success-dim)",
                  borderRadius: 8,
                  border: "1px solid rgba(16,185,129,0.15)",
                }}
              >
                <span style={{ color: "var(--success)", fontWeight: 700, fontSize: 13 }}>↑</span>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{f}</span>
              </div>
            ))}
            {result.factors_negative.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "10px 14px",
                  background: "var(--error-dim)",
                  borderRadius: 8,
                  border: "1px solid rgba(248,113,113,0.15)",
                }}
              >
                <span style={{ color: "var(--error)", fontWeight: 700, fontSize: 13 }}>↓</span>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning */}
      {result.warning && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--gold-dim)",
            border: "1px solid rgba(245,158,11,0.20)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--gold)",
            display: "flex",
            gap: 8,
          }}
        >
          <span>⚠</span>
          <span>{result.warning}</span>
        </div>
      )}

      {/* Comparable properties */}
      {comparables.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Παρόμοια Ακίνητα
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {comparables.slice(0, 5).map((c) => (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  padding: "10px 14px",
                  background: "var(--bg-glass)",
                  borderRadius: 8,
                  fontSize: 13,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    €{Math.round(c.price).toLocaleString("el-GR")}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {c.area_sqm}τμ · {c.bedrooms ?? "—"}υδ
                  </div>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                  {c.municipality}
                </div>
                <div style={{ textAlign: "right", color: "var(--text-secondary)", fontSize: 12 }}>
                  €{Math.round(c.price_per_sqm).toLocaleString()}/τμ
                  {c.has_sea_view && (
                    <span style={{ marginLeft: 4, fontSize: 10 }}>🌊</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model version */}
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
        Model {result.model_version} · XGBoost · Synthetic training data
        <div style={{ marginTop: 6, fontSize: 10, opacity: 0.6 }}>
          Disclaimer: Αυτή η αναφορά δημιουργήθηκε αλγοριθμικά και δεν αποτελεί επίσημη εκτίμηση RICS.
        </div>
      </div>
      </div> {/* End of PDF PDF wrapper */}

      <button
        onClick={exportPDF}
        className="btn btn-secondary no-print"
        style={{ marginTop: 8, padding: "12px", fontSize: 14, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
      >
        <Printer size={18} />
        Εκτύπωση / Αποθήκευση Αναφοράς (PDF)
      </button>
    </div>
  );
}

export default function EstimatePage() {
  const [address, setAddress] = useState("");
  const [form, setForm] = useState<PropertyInput>(DEFAULT_FORM);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const municipalities = MUNICIPALITIES[form.district] || [];

  // Reset municipality when district changes
  useEffect(() => {
    const munis = MUNICIPALITIES[form.district] || [];
    setForm((f) => ({ ...f, municipality: munis[0] || "" }));
  }, [form.district]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setResult(null);
      setComparables([]);

      try {
        const [val, comps] = await Promise.all([
          estimateProperty(form),
          getComparables(form.district, form.property_type, form.area_sqm, form.municipality),
        ]);
        setResult(val);
        setComparables(comps);
        // Scroll to result
        setTimeout(() => {
          document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Σφάλμα κατά την εκτίμηση";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Page header */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "40px 0 32px",
        }}
      >
        <div className="container">
          <div className="badge badge-accent" style={{ marginBottom: 12 }}>
            Εκτίμηση Ακινήτου
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 8 }}>
            Εκτίμηση Αξίας Ακινήτου
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Συμπλήρωσε τα στοιχεία και πάρε επαγγελματική εκτίμηση σε δευτερόλεπτα
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: result ? "1fr 1fr" : "1fr",
            gap: 40,
            maxWidth: result ? "100%" : 660,
            margin: result ? "0" : "0 auto",
            transition: "all 0.4s ease",
          }}
        >
          {/* ===== FORM ===== */}
          <div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Property Type */}
              <div>
                <div className="form-label" style={{ marginBottom: 10 }}>Τύπος Ακινήτου</div>
                <div className="toggle-group">
                  {PROPERTY_TYPES.map((pt) => (
                    <button
                      key={pt.value}
                      type="button"
                      id={`type-${pt.value}`}
                      className={`toggle-btn ${form.property_type === pt.value ? "active" : ""}`}
                      onClick={() => setForm({ ...form, property_type: pt.value })}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="address-input">Οδός / Διεύθυνση (Προαιρετικό)</label>
                <input
                  id="address-input"
                  type="text"
                  className="form-input"
                  placeholder="Εισαγωγή ακριβούς διεύθυνσης για την αναφορά PDF"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* District + Municipality */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="district-select">Επαρχία</label>
                  <select
                    id="district-select"
                    className="form-select"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    required
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="municipality-select">Περιοχή</label>
                  <select
                    id="municipality-select"
                    className="form-select"
                    value={form.municipality}
                    onChange={(e) => setForm({ ...form, municipality: e.target.value })}
                    required
                  >
                    {municipalities.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Area + Bedrooms + Bathrooms */}
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="area-input">Εμβαδόν (τμ)</label>
                  <input
                    id="area-input"
                    type="number"
                    className="form-input"
                    value={form.area_sqm}
                    min={20}
                    max={1000}
                    onChange={(e) => setForm({ ...form, area_sqm: Number(e.target.value) })}
                    required
                  />
                </div>
                {form.property_type !== "land" && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="bedrooms-input">Υπνοδωμάτια</label>
                      <input
                        id="bedrooms-input"
                        type="number"
                        className="form-input"
                        value={form.bedrooms}
                        min={0}
                        max={10}
                        onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="bathrooms-input">Μπάνια</label>
                      <input
                        id="bathrooms-input"
                        type="number"
                        className="form-input"
                        value={form.bathrooms}
                        min={1}
                        max={8}
                        onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Year + Floor */}
              {form.property_type !== "land" && (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="yearbbuilt-input">Έτος Κατασκευής</label>
                    <input
                      id="yearbbuilt-input"
                      type="number"
                      className="form-input"
                      placeholder="π.χ. 2010"
                      value={form.year_built ?? ""}
                      min={1950}
                      max={2026}
                      onChange={(e) =>
                        setForm({ ...form, year_built: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                  {form.property_type === "apartment" && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="floor-input">Όροφος</label>
                      <input
                        id="floor-input"
                        type="number"
                        className="form-input"
                        placeholder="π.χ. 3"
                        value={form.floor ?? ""}
                        min={0}
                        max={50}
                        onChange={(e) =>
                          setForm({ ...form, floor: e.target.value ? Number(e.target.value) : undefined })
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Listing type */}
              <div>
                <div className="form-label" style={{ marginBottom: 10 }}>Τύπος Αγγελίας</div>
                <div className="toggle-group">
                  {[
                    { value: "resale", label: "Μεταπώληση" },
                    { value: "new_build", label: "Νεόδμητο" },
                  ].map((lt) => (
                    <button
                      key={lt.value}
                      type="button"
                      id={`listing-${lt.value}`}
                      className={`toggle-btn ${form.listing_type === lt.value ? "active" : ""}`}
                      onClick={() => setForm({ ...form, listing_type: lt.value })}
                    >
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="form-label" style={{ marginBottom: 10 }}>Χαρακτηριστικά</div>
                <div className="toggle-group">
                  {[
                    { key: "has_title_deed" as const, label: "Τίτλος Ιδιοκτησίας" },
                    { key: "has_sea_view" as const, label: "Θέα Θάλασσα" },
                    { key: "has_parking" as const, label: "Πάρκινγκ" },
                    { key: "has_pool" as const, label: "Πισίνα" },
                    { key: "has_garden" as const, label: "Κήπος" },
                  ].map((feat) => (
                    <button
                      key={feat.key}
                      type="button"
                      id={`feat-${feat.key}`}
                      className={`toggle-btn ${form[feat.key] ? "active" : ""}`}
                      onClick={() => setForm({ ...form, [feat.key]: !form[feat.key] })}
                    >
                      {feat.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                  💡 Ο τίτλος ιδιοκτησίας επηρεάζει σημαντικά την αξία στην Κύπρο (+15-22%)
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "var(--error-dim)",
                    border: "1px solid rgba(248,113,113,0.20)",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "var(--error)",
                  }}
                >
                  ⚠ {error}
                  {error.includes("Model") && (
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                      Τρέξε: <code>python scripts/train_model.py</code> στο backend
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                id="submit-estimate"
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: "16px", fontSize: 16, fontWeight: 700 }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="spinner" />
                    Αναλύω...
                  </span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Εκτίμηση Τώρα
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ===== RESULT ===== */}
          {result && (
            <div id="result-section">
              <ResultCard result={result} comparables={comparables} area_sqm={form.area_sqm} address={address} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
