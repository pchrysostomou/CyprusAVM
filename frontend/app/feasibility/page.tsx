"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Navigation,
  AlertTriangle,
  Lock,
  Building,
  Trees,
  ChevronRight,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DISTRICTS = [
  { value: "1", label: "Λευκωσία (Nicosia)" },
  { value: "2", label: "Κερύνεια (Kyrenia)" },
  { value: "3", label: "Αμμόχωστος (Famagusta)" },
  { value: "4", label: "Λάρνακα (Larnaca)" },
  { value: "5", label: "Λεμεσός (Limassol)" },
  { value: "6", label: "Πάφος (Paphos)" },
];

interface DLSResult {
  sbpi: string | number;
  area: number;
  zone: string;
  density: string | number | null;
  coverage: string | number | null;
  floors: string | number | null;
  height: string | number | null;
  kind: string | null;
  valuation: number | string | null;
}

export default function FeasibilityPage() {
  const [district, setDistrict] = useState("");
  const [villages, setVillages] = useState<{ code: string; name: string }[]>([]);
  const [village, setVillage] = useState("");
  const [parcel, setParcel] = useState("");
  const [quarter, setQuarter] = useState("");
  const [block, setBlock] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DLSResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!district) {
      setVillages([]);
      setVillage("");
      return;
    }
    const fetchVillages = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dls/villages/${district}`);
        const data = await res.json();
        setVillages(data.villages || []);
      } catch (err) {
        console.error("Failed to fetch villages", err);
      }
    };
    fetchVillages();
  }, [district]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const selectedVillage = villages.find((v) => v.name === village);
      const vilCode = selectedVillage ? selectedVillage.code : village;

      const searchRes = await fetch(
        `${API_URL}/api/dls/search-parcel?dist_code=${district}&vil_code=${vilCode}&parcel_no=${parcel}&block_no=${block}&quarter=${quarter}`
      );
      const searchData = await searchRes.json();

      if (searchData.error) {
        setError(
          "Δεν βρέθηκε το τεμάχιο. Παρακαλώ ελέγξτε τα στοιχεία (Επαρχία, Κωδ. Χωριού, Αρ. Τεμαχίου)."
        );
        setLoading(false);
        return;
      }

      const sbpi = searchData.parcel.OBJECTID;
      const parcelArea = searchData.parcel["SHAPE.AREA"] || 0;

      const infoRes = await fetch(`${API_URL}/api/dls/parcel-info/${sbpi}`);
      const infoData = await infoRes.json();

      setResult({
        sbpi,
        area: parcelArea || infoData.extents || 0,
        zone: infoData.zoneCode || "Άγνωστη",
        density: infoData.density ?? null,
        coverage: infoData.coverage ?? null,
        floors: infoData.maxFloors ?? null,
        height: infoData.maxHeight ?? null,
        kind: infoData.propertyKind || "Χωράφι/Οικόπεδο",
        valuation: infoData.generalValuation2021 ?? null,
      });
    } catch {
      setError(
        "Υπήρξε σφάλμα κατά την επικοινωνία με το Κτηματολόγιο (DLS). Βεβαιωθείτε ότι το backend τρέχει."
      );
    } finally {
      setLoading(false);
    }
  };

  const roadDeduction = result ? Math.round(result.area * 0.2) : 0;
  const afterRoad = result ? result.area - roadDeduction : 0;
  const greenDeduction = Math.round(afterRoad * 0.1);
  const netArea = Math.round(afterRoad - greenDeduction);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      {/* Page Header */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "40px 0 32px",
        }}
      >
        <div className="container">
          <div className="badge badge-accent" style={{ marginBottom: 12 }}>
            Κτηματολόγιο · Live DLS API
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 8 }}>
            CyprusAVM Feasibility Engine
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--success)",
                display: "inline-block",
                boxShadow: "0 0 8px var(--success)",
                animation: "pulse-glow 2s infinite",
              }}
            />
            Live σύνδεση με το REST API του Κτηματολογίου (DLS)
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* MODULE 1: PARCEL SEARCH */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div
              style={{
                background: "rgba(45,212,191,0.05)",
                borderBottom: "1px solid var(--border)",
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Search size={18} color="var(--accent)" />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Module 1 — Αναζήτηση Τεμαχίου
              </h2>
            </div>

            <div style={{ padding: 24 }}>
              <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* District + Village row */}
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Επαρχία (District)</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                      className="form-select"
                    >
                      <option value="">Επιλογή επαρχίας...</option>
                      {DISTRICTS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Δήμος / Χωριό{" "}
                      {villages.length > 0 && (
                        <span style={{ color: "var(--accent)", fontWeight: 500 }}>
                          ({villages.length} διαθέσιμα)
                        </span>
                      )}
                    </label>
                    <input
                      list="village-options"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      required
                      disabled={!district || villages.length === 0}
                      placeholder={
                        !district
                          ? "Επιλέξτε πρώτα επαρχία..."
                          : villages.length === 0
                          ? "Φόρτωση χωριών..."
                          : "Πληκτρολογήστε για αναζήτηση..."
                      }
                      className="form-input"
                      style={{ opacity: !district ? 0.5 : 1 }}
                    />
                    <datalist id="village-options">
                      {villages.map((v) => (
                        <option key={v.code} value={v.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Parcel details row */}
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Αριθμός Τεμαχίου *</label>
                    <input
                      type="text"
                      value={parcel}
                      onChange={(e) => setParcel(e.target.value)}
                      required
                      placeholder="π.χ. 57"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ενορία (Quarter)</label>
                    <input
                      type="text"
                      value={quarter}
                      onChange={(e) => setQuarter(e.target.value)}
                      placeholder="π.χ. 4"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Τμήμα (Block)</label>
                    <input
                      type="text"
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      placeholder="π.χ. 0"
                      className="form-input"
                    />
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "var(--error-dim)",
                      border: "1px solid rgba(248,113,113,0.20)",
                      borderRadius: 8,
                      fontSize: 14,
                      color: "var(--error)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ fontSize: 16, padding: "14px" }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Αναζήτηση στο Κτηματολόγιο...
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      Αναζήτηση &amp; Φόρτωση Τεμαχίου
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RESULTS */}
          {result && (
            <>
              {/* DLS Disclaimer */}
              <div
                style={{
                  padding: "14px 18px",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "var(--warning)",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <p>
                  <strong>Σημαντικό:</strong> Τα δεδομένα αντλούνται{" "}
                  <strong>ζωντανά από τη Γενική Εκτίμηση του Κτηματολογίου (DLS — 1.1.2021)</strong>. Η
                  εκτίμηση είναι επίσημη κτηματολογιακή αξία, όχι εμπορική τιμή αγοράς.
                </p>
              </div>

              {/* MODULE 2: ZONE & DEDUCTIONS */}
              <div className="card" style={{ overflow: "hidden" }}>
                <div
                  style={{
                    background: "rgba(14,165,233,0.06)",
                    borderBottom: "1px solid var(--border)",
                    padding: "16px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Building size={18} color="#0EA5E9" />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                    Module 2 — Παράμετροι Ζώνης &amp; Αποκοπές
                  </h2>
                </div>
                <div style={{ padding: 24 }}>

                  {/* Zone stats grid */}
                  <div className="grid-4" style={{ marginBottom: 20 }}>
                    {[
                      { label: "Πολεοδομική Ζώνη", value: result.zone },
                      {
                        label: "Συντελεστής Δόμησης",
                        value:
                          result.density != null
                            ? `${(parseFloat(String(result.density)) * 100).toFixed(0)}%`
                            : "—",
                      },
                      {
                        label: "Κάλυψη",
                        value:
                          result.coverage != null
                            ? `${(parseFloat(String(result.coverage)) * 100).toFixed(0)}%`
                            : "—",
                      },
                      {
                        label: "Όροφοι / Ύψος",
                        value: `${result.floors ?? "—"} / ${result.height != null ? result.height + "m" : "—"}`,
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: "14px 16px",
                        }}
                      >
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {stat.label}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Land deductions table */}
                  <div
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Land Deductions (Αποκοπές Οικοπέδου)
                    </div>

                    {[
                      {
                        icon: null,
                        label: "Μεικτό Εμβαδόν (Gross Plot Area)",
                        value: `${Math.round(result.area).toLocaleString("el-GR")} m²`,
                        color: "var(--text-primary)",
                        bold: true,
                      },
                      {
                        icon: <Navigation size={14} />,
                        label: "Αποκοπή Δρόμου (20%)",
                        value: `− ${roadDeduction.toLocaleString("el-GR")} m²`,
                        color: "var(--error)",
                        bold: false,
                      },
                      {
                        icon: <Trees size={14} />,
                        label: "Αποκοπή Πράσινου (10% επί υπολοίπου)",
                        value: `− ${greenDeduction.toLocaleString("el-GR")} m²`,
                        color: "var(--error)",
                        bold: false,
                      },
                      {
                        icon: <ChevronRight size={14} />,
                        label: "Καθαρό Αναπτύξιμο Εμβαδόν (Net)",
                        value: `${netArea.toLocaleString("el-GR")} m²`,
                        color: "var(--success)",
                        bold: true,
                      },
                    ].map((row, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "12px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                          background: i === 3 ? "rgba(16,185,129,0.06)" : undefined,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {row.icon && (
                            <span style={{ color: row.color, opacity: 0.8 }}>{row.icon}</span>
                          )}
                          {row.label}
                        </span>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: row.bold ? 800 : 600,
                            color: row.color,
                            fontFamily: "DM Mono, monospace",
                          }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MODULE 3: 3D MASSING — Coming Soon */}
              <div className="card" style={{ overflow: "hidden", opacity: 0.85 }}>
                <div
                  style={{
                    background: "rgba(99,102,241,0.06)",
                    borderBottom: "1px solid var(--border)",
                    padding: "16px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Building size={18} color="#6366F1" />
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                      Module 3 — 3D Building Massing
                    </h2>
                  </div>
                  <span
                    style={{
                      background: "rgba(99,102,241,0.15)",
                      color: "#818CF8",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 100,
                      border: "1px solid rgba(99,102,241,0.3)",
                    }}
                  >
                    Coming Soon
                  </span>
                </div>
                <div style={{ padding: 24, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(8,12,24,0.75)",
                      backdropFilter: "blur(3px)",
                      zIndex: 10,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <Lock size={28} color="var(--text-muted)" />
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center" }}>
                      Το 3D Massing Engine θα ενσωματωθεί στην επόμενη φάση ανάπτυξης.
                    </p>
                  </div>
                  <div
                    style={{
                      height: 140,
                      background: "var(--bg-secondary)",
                      borderRadius: 10,
                      border: "1px dashed var(--border)",
                    }}
                  />
                </div>
              </div>

              {/* MODULE 7: OFFICIAL DLS VALUATION */}
              <div className="card card-glow" style={{ overflow: "hidden" }}>
                <div
                  style={{
                    background: "rgba(16,185,129,0.06)",
                    borderBottom: "1px solid rgba(16,185,129,0.2)",
                    padding: "16px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Building size={18} color="var(--success)" />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--success)" }}>
                    Module 7 — Επίσημη Αξία Κτηματολογίου (DLS)
                  </h2>
                </div>
                <div style={{ padding: 32, textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--success)",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      marginBottom: 12,
                    }}
                  >
                    ΑΞΙΑ ΚΤΗΜΑΤΟΛΟΓΙΟΥ (1.1.2021)
                  </p>
                  <div
                    className="text-gradient"
                    style={{
                      fontSize: "clamp(36px, 5vw, 56px)",
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      marginBottom: 12,
                    }}
                  >
                    {result.valuation != null
                      ? typeof result.valuation === "number"
                        ? `€${result.valuation.toLocaleString("el-GR")}`
                        : result.valuation
                      : "Δεν διατίθεται στο DLS"}
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border)",
                      padding: "6px 14px",
                      borderRadius: 100,
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Building size={14} color="var(--success)" />
                    {result.kind ?? "Ακίνητο"} · SBPI: {result.sbpi}
                  </div>
                  <p
                    style={{
                      marginTop: 16,
                      fontSize: 11,
                      color: "var(--text-muted)",
                      maxWidth: 420,
                      margin: "16px auto 0",
                      lineHeight: 1.6,
                    }}
                  >
                    Disclaimer: Η τιμή αυτή είναι η επίσημη Γενική Εκτίμηση του Κράτους (Κτηματολόγιο)
                    και δεν αντικατοπτρίζει την τρέχουσα εμπορική αξία της ελεύθερης αγοράς.
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
