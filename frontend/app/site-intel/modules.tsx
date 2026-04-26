"use client";
import { useState, useEffect } from "react";
import { ModuleHeader, StatCard, ScoreBar, FindingRow } from "./components";
import { TrendingUp, Zap, FileText, Map } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── MODULE 3: LAND ASSESSMENT ───────────────────────────────────────────────
export function LandAssessmentModule({ distCode, zoneCode, isField, areaGIS, density }: {
  distCode: string; zoneCode: string | null; isField: boolean | null; areaGIS: number; density: number | null;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!distCode) return;
    setLoading(true);
    const params = new URLSearchParams({
      dist_code: distCode,
      zone_code: zoneCode || "",
      is_field: String(isField ?? false),
      area_gis: String(areaGIS || 0),
      density: String(density || 0),
    });
    fetch(`${API}/api/dls/land-assessment?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [distCode, zoneCode, isField, areaGIS, density]);

  const gradeColor: Record<string, string> = { A: "#10B981", B: "#34D399", C: "#FBBF24", D: "#F87171", F: "#EF4444" };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <ModuleHeader icon={<TrendingUp size={16} />} title="Module 3 — Land Assessment (Harvest Score)" color="#8B5CF6"
        badge={loading ? "..." : data ? `Grade ${data.grade}` : undefined}
        sub="Site scoring engine · 5 domains · 16 layers" />
      <div style={{ padding: 20 }}>
        {loading && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 20 }}>Αξιολόγηση τεμαχίου...</div>}
        {data && (
          <>
            {/* Harvest Score */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, background: "var(--bg-secondary)", borderRadius: 10, padding: "16px 20px", border: "1px solid var(--border)" }}>
              <div style={{ textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: gradeColor[data.grade] || "#2DD4BF", lineHeight: 1 }}>{data.harvestScore}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>/ 100</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: gradeColor[data.grade], marginTop: 4 }}>Grade {data.grade}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>COMPOSITE HARVEST SCORE</div>
                {[
                  { key: "zoning", label: "Ζώνη & Χρήσεις Γης", w: 30 },
                  { key: "hazards", label: "Φυσικοί Κίνδυνοι", w: 25 },
                  { key: "environment", label: "Περιβαλλοντικοί Περιορισμοί", w: 20 },
                  { key: "infrastructure", label: "Υποδομές & Δίκτυα", w: 15 },
                  { key: "siteContext", label: "Πλαίσιο Τοποθεσίας", w: 10 },
                ].map(d => (
                  <ScoreBar key={d.key} label={d.label} score={data.domains[d.key]?.score ?? 0} weight={d.w}
                    color={gradeColor[data.grade] || "#2DD4BF"} />
                ))}
              </div>
            </div>
            {/* Findings */}
            {["zoning", "hazards", "environment", "infrastructure", "siteContext"].map(domain => {
              const dom = data.domains[domain];
              const items = dom?.findings || dom?.constraints || [];
              return items.map((f: any, i: number) => (
                <FindingRow key={`${domain}-${i}`} type={f.type} text={f.text} tag={f.tag} />
              ));
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ─── MODULE 5: INCENTIVES ENGINE ─────────────────────────────────────────────
export function IncentivesModule({ distCode, zoneCode, density, netArea }: {
  distCode: string; zoneCode: string | null; density: number | null; netArea: number | null;
}) {
  const incentives = [
    { name: "Ενεργειακή Αποδοτικότητα", bonus: "+5% Σ.Δ.", desc: "Κτίρια κατηγορίας Β ή ανώτερης (σχεδόν μηδενικής ενέργειας)", ref: "Κανονισμός 12(γ)/2023", color: "#10B981" },
    { name: "Προσιτή Κατοικία", bonus: "+25% Σ.Δ.", desc: "Εφαρμογή Διατάγματος 1/2023 για προσιτή κατοικία", ref: "Διάταγμα 1/2023", color: "#2DD4BF" },
    { name: "Σκεπαστές Βεράντες", bonus: "Έως +25% Κάλυψης", desc: "Σκεπαστές βεράντες δεν προσμετρώνται στον Σ.Δ.", ref: "Άρθρο 9, Κανόνες Δόμησης", color: "#6366F1" },
    { name: "Υπόγειοι Χώροι", bonus: "Εξαίρεση Σ.Δ.", desc: "Υπόγεια γκαράζ & αποθήκες εξαιρούνται από τον Σ.Δ.", ref: "Άρθρο 11, Κανόνες Δόμησης", color: "#F59E0B" },
    { name: "Ανελκυστήρες / Κλιμ.", bonus: "Εξαίρεση Σ.Δ.", desc: "Χώροι ανελκυστήρων, κλιμακοστάσια εξαιρούνται", ref: "Άρθρο 8, Κανόνες Δόμησης", color: "#60A5FA" },
  ];

  const densityNum = density ?? 0;
  const netAreaNum = netArea ?? 0;
  const baseGFA = Math.round(netAreaNum * densityNum);
  const energyGFA = Math.round(netAreaNum * densityNum * 1.05);
  const affordableGFA = Math.round(netAreaNum * densityNum * 1.25);
  const maxGFA = Math.round(netAreaNum * densityNum * 1.30);

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <ModuleHeader icon={<Zap size={16} />} title="Module 5 — Incentives Engine" color="#F59E0B"
        badge={`${incentives.length} Κίνητρα`} sub="Cyprus Town Planning Regulations · Bonus mechanisms" />
      <div style={{ padding: 20 }}>
        {baseGFA > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
            <StatCard label="Βασική Δόμηση (Σ.Δ.)" value={`${baseGFA.toLocaleString("el-GR")} m²`} />
            <StatCard label="Με Ενεργειακό (+5%)" value={`${energyGFA.toLocaleString("el-GR")} m²`} color="#10B981" />
            <StatCard label="Με Προσιτή Κατ. (+25%)" value={`${affordableGFA.toLocaleString("el-GR")} m²`} color="#2DD4BF" />
            <StatCard label="Μέγιστη Δόμηση (+30%)" value={`${maxGFA.toLocaleString("el-GR")} m²`} color="#F59E0B" accent />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {incentives.map((inc, i) => (
            <div key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ minWidth: 8, height: 8, borderRadius: "50%", background: inc.color, marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{inc.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: inc.color, background: `color-mix(in srgb, ${inc.color} 15%, transparent)`, padding: "2px 10px", borderRadius: 100 }}>{inc.bonus}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 3 }}>{inc.desc}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>{inc.ref}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MODULE 6: MARKET VALUE + DEVELOPMENT APPRAISAL ─────────────────────────
export function MarketValueModule({ distCode, netArea, density, dlsValuation2021, isField, zoneCode }: {
  distCode: string; netArea: number | null; density: number | null;
  dlsValuation2021: number | null; isField: boolean | null; zoneCode: string | null;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!distCode || !netArea) return;
    setLoading(true);
    const params = new URLSearchParams({
      dist_code: distCode,
      net_area: String(netArea || 0),
      density: String(density || 0),
      dls_valuation_2021: String(dlsValuation2021 || 0),
      is_field: String(isField ?? false),
      zone_code: zoneCode || "",
    });
    fetch(`${API}/api/dls/market-value?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [distCode, netArea, density, dlsValuation2021, isField, zoneCode]);

  const confColor: Record<string, string> = { high: "#10B981", medium: "#FBBF24", low: "#F87171" };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <ModuleHeader icon={<TrendingUp size={16} />} title="Module 6 — Market Value & Development Appraisal" color="#10B981"
        sub="Real-time market valuation · Residual land value method" />
      <div style={{ padding: 20 }}>
        {loading && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 20 }}>Υπολογισμός αγοραίας αξίας...</div>}
        {data && (
          <>
            <div style={{ textAlign: "center", background: "var(--bg-secondary)", borderRadius: 12, padding: "20px", border: "1px solid var(--border-accent)", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Εκτιμώμενη Αγοραία Αξία · {data.districtName}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: "var(--accent)", letterSpacing: "-0.04em", lineHeight: 1 }}>€{data.marketEstimate?.toLocaleString("el-GR")}</div>
              <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 100, background: "rgba(0,0,0,.3)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>{data.method}</span>
                <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 100, background: `color-mix(in srgb, ${confColor[data.confidence]} 15%, transparent)`, color: confColor[data.confidence] }}>Confidence: {data.confidence?.toUpperCase()}</span>
              </div>
            </div>
            {/* Pricing grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
              <StatCard label="Τιμή/m² Γης" value={`€${data.pricePerSqmLand?.toLocaleString("el-GR")}`} />
              <StatCard label="Τιμή/m² Κατοικίας" value={`€${data.pricePerSqmResidential?.toLocaleString("el-GR")}`} />
              <StatCard label="Πολλαπλασιαστής 2021→2025" value={`×${data.multiplier}`} accent />
            </div>
            {/* Development Appraisal */}
            {data.developmentAppraisal?.gfa > 0 && (
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Development Appraisal — Μέθοδος Υπολειμματικής Αξίας
                </div>
                {[
                  { label: "Συνολική Αναπτύξιμη Επιφάνεια (GFA)", value: `${data.developmentAppraisal.gfa.toLocaleString("el-GR")} m²`, color: "var(--text-primary)" },
                  { label: "Ακαθάριστα Έσοδα Πωλήσεων", value: `€${data.developmentAppraisal.grossRevenue.toLocaleString("el-GR")}`, color: "#10B981" },
                  { label: "Κόστος Κατασκευής (€1.200/m²)", value: `− €${data.developmentAppraisal.constructionCost.toLocaleString("el-GR")}`, color: "#F87171" },
                  { label: "Περιθώριο Κέρδους (15%)", value: `− €${data.developmentAppraisal.developerMargin.toLocaleString("el-GR")}`, color: "#F87171" },
                  { label: "Υπολειμματική Αξία Γης", value: `€${data.developmentAppraisal.residualLandValue.toLocaleString("el-GR")}`, color: "#2DD4BF", bold: true },
                ].map((row, i, arr) => (
                  <div key={i} style={{ padding: "11px 16px", display: "flex", justifyContent: "space-between", borderTop: i > 0 ? "1px solid var(--border)" : undefined, background: i === arr.length - 1 ? "rgba(45,212,191,0.05)" : undefined }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: (row as any).bold ? 800 : 600, color: row.color, fontFamily: "DM Mono, monospace" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
