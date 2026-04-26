"use client";
import { useState } from "react";
import { ModuleHeader, StatCard } from "./components";
import { TrendingUp } from "lucide-react";

const DISTRICT_DATA: Record<string, { name: string; multiplier: number; residential: number; land: number; office: number; construction: number }> = {
  "1": { name: "Λευκωσία",   multiplier: 1.28, residential: 2100, land: 500,  office: 2800, construction: 1200 },
  "3": { name: "Αμμόχωστος", multiplier: 1.18, residential: 1450, land: 300,  office: 1800, construction: 1050 },
  "4": { name: "Λάρνακα",    multiplier: 1.22, residential: 1650, land: 380,  office: 2100, construction: 1100 },
  "5": { name: "Λεμεσός",    multiplier: 1.42, residential: 2900, land: 700,  office: 3500, construction: 1350 },
  "6": { name: "Πάφος",      multiplier: 1.38, residential: 2150, land: 520,  office: 2600, construction: 1250 },
};

interface Props {
  distCode: string;
  netArea: number | null;
  baseBd: number | null;
  dlsValuation: number | null;
  gfa: number | null;
  nia: number | null;
}

export default function DevelopmentAppraisal({ distCode, netArea, baseBd, dlsValuation, gfa, nia }: Props) {
  const dist = DISTRICT_DATA[distCode] || DISTRICT_DATA["5"];
  const [fieldEurM2, setFieldEurM2] = useState(dist.land);
  const [plotEurM2, setPlotEurM2] = useState(Math.round(dist.land * 1.35));
  const [cosEurM2, setCosEurM2] = useState(dist.residential);
  const [typology, setTypology] = useState<"residential" | "office">("residential");
  const [isField, setIsField] = useState(false);

  const area = netArea || 0;
  const gfaNum = gfa || 0;
  const niaNum = nia || gfaNum * 0.82;
  const constructCost = dist.construction;

  // Land value
  const landPricePerM2 = isField ? fieldEurM2 : plotEurM2;
  const landValue = Math.round(area * landPricePerM2);

  // DLS-based current market value
  const dlsMarketValue = dlsValuation ? Math.round(dlsValuation * dist.multiplier) : 0;

  // GDV — Gross Development Value
  const gdv = Math.round(niaNum * cosEurM2);

  // Construction cost
  const constructionTotal = Math.round(gfaNum * constructCost);

  // Professional fees (10% of construction)
  const professionalFees = Math.round(constructionTotal * 0.10);

  // Finance & contingency (5%)
  const finance = Math.round(constructionTotal * 0.05);

  // Developer profit (15% of GDV)
  const devProfit = Math.round(gdv * 0.15);

  // Residual land value
  const residualLandValue = Math.max(0, gdv - constructionTotal - professionalFees - finance - devProfit);

  // Net profit (if buying at land value)
  const netProfit = Math.max(0, residualLandValue - landValue);

  // ROI
  const totalInvest = landValue + constructionTotal + professionalFees + finance;
  const roi = totalInvest > 0 ? Math.round((netProfit / totalInvest) * 100) : 0;

  // Profit margin
  const margin = gdv > 0 ? Math.round((netProfit / gdv) * 100) : 0;

  const roiColor = roi >= 20 ? "#10B981" : roi >= 10 ? "#FBBF24" : "#F87171";

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <ModuleHeader icon={<TrendingUp size={16} />} title="Module 6 — Valuation Evidence & Development Appraisal" color="#10B981"
        badge={roi > 0 ? `ROI ${roi}%` : undefined}
        sub="Residual Land Value Method · District market rates · Enter comparable evidence" />
      <div style={{ padding: 20 }}>

        {/* User inputs */}
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Land & Sales Valuation — {dist.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>Εισάγετε τεκμήρια συγκριτικών στοιχείων ή αφήστε τις προεπιλεγμένες τιμές αγοράς {dist.name}.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Τυπολογία</label>
              <select className="form-select" value={typology} onChange={e => { setTypology(e.target.value as any); setCosEurM2(e.target.value === "office" ? dist.office : dist.residential); }}>
                <option value="residential">Κατοικία</option>
                <option value="office">Γραφεία / Εμπόριο</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Ως Τεμάχιο (χωράφι)</label>
              <select className="form-select" value={String(isField)} onChange={e => setIsField(e.target.value === "true")}>
                <option value="false">Οικόπεδο (Εντός Σχεδίου)</option>
                <option value="true">Χωράφι (Αγρoτική Γη)</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Χωράφι €/m² (as-is)</label>
              <input type="number" className="form-input" value={fieldEurM2} onChange={e => setFieldEurM2(+e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Οικόπεδο €/m² (μετά αποκοπές)</label>
              <input type="number" className="form-input" value={plotEurM2} onChange={e => setPlotEurM2(+e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">COS €/covered m² (πώληση)</label>
              <input type="number" className="form-input" value={cosEurM2} onChange={e => setCosEurM2(+e.target.value)} />
            </div>
          </div>
        </div>

        {/* DLS Market Value */}
        {dlsMarketValue > 0 && (
          <div style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>ΕΚΤΙΜΩΜΕΝΗ ΑΓΟΡΑΙΑ ΑΞΙΑ (DLS 2021 × ×{dist.multiplier})</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "var(--accent)" }}>€{dlsMarketValue.toLocaleString("el-GR")}</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
              <div>Πολλαπλασιαστής: ×{dist.multiplier}</div>
              <div>Confidence: HIGH</div>
            </div>
          </div>
        )}

        {/* Development Appraisal table */}
        {gfaNum > 0 && (
          <>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Development Appraisal — Μέθοδος Υπολειμματικής Αξίας Γης
              </div>
              {[
                { label: "Gross Floor Area (GFA)", value: `${gfaNum.toLocaleString("el-GR")} m²`, color: "var(--text-primary)", bold: false },
                { label: "Net Internal Area (NIA est.)", value: `${niaNum.toLocaleString("el-GR")} m²`, color: "var(--text-primary)", bold: false },
                { label: `GDV — Gross Development Value (NIA × €${cosEurM2}/m²)`, value: `€${gdv.toLocaleString("el-GR")}`, color: "#10B981", bold: true },
                { label: `Construction Cost (GFA × €${constructCost}/m²)`, value: `− €${constructionTotal.toLocaleString("el-GR")}`, color: "#F87171", bold: false },
                { label: "Professional Fees (10%)", value: `− €${professionalFees.toLocaleString("el-GR")}`, color: "#F87171", bold: false },
                { label: "Finance & Contingency (5%)", value: `− €${finance.toLocaleString("el-GR")}`, color: "#F87171", bold: false },
                { label: "Developer Profit (15% of GDV)", value: `− €${devProfit.toLocaleString("el-GR")}`, color: "#FBBF24", bold: false },
                { label: "Residual Land Value", value: `€${residualLandValue.toLocaleString("el-GR")}`, color: "#2DD4BF", bold: true },
                { label: `Land Cost (${isField ? "Field" : "Plot"} @ €${landPricePerM2}/m²)`, value: `− €${landValue.toLocaleString("el-GR")}`, color: "#F87171", bold: false },
                { label: "Net Profit", value: `€${netProfit.toLocaleString("el-GR")}`, color: roi >= 10 ? "#10B981" : "#F87171", bold: true },
              ].map((row, i, arr) => (
                <div key={i} style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: i > 0 ? "1px solid var(--border)" : undefined, background: row.bold ? "rgba(255,255,255,0.02)" : undefined }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: row.bold ? 800 : 600, color: row.color, fontFamily: "DM Mono, monospace" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* ROI Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <StatCard label="Total Investment" value={`€${totalInvest.toLocaleString("el-GR")}`} />
              <StatCard label="Net Profit" value={`€${netProfit.toLocaleString("el-GR")}`} color={roi >= 10 ? "#10B981" : "#F87171"} />
              <StatCard label="ROI %" value={`${roi}%`} color={roiColor} accent={roi >= 20} />
              <StatCard label="Profit Margin" value={`${margin}%`} color={roiColor} />
            </div>
          </>
        )}

        {!gfaNum && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 20 }}>
            Συμπληρώστε Module 3 (Building Massing) για πλήρη ανάλυση
          </div>
        )}
      </div>
    </div>
  );
}
