"use client";
import { useState, useEffect } from "react";
import { ModuleHeader, StatCard } from "./components";
import { Building2 } from "lucide-react";
import dynamic from "next/dynamic";
const Building3DView = dynamic(() => import("./Building3DView"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MassingResult {
  summary: { net_area: number; base_bd: number; effective_bd: number; coverage: number; bonus_bd_pct: number };
  base_design: { gfa: number; achieved_gfa: number; covered_veranda: number; total_built_area: number; nia_estimate: number; efficiency_pct: number; max_footprint: number; ground_footprint: number; floors: number; height_m: number };
  bonus_design: { gfa: number; achieved_gfa: number; covered_veranda: number; total_built_area: number; nia_estimate: number; extra_gfa: number; extra_nia: number };
  floor_stack: Array<{ level: string; floor_num: number; internal_m2: number; veranda_m2: number; total_m2: number; height_m: number; elevation_m: number }>;
  basement: { area_m2: number; use: string; counts_toward_bd: boolean; legal_ref: string } | null;
  bd_exclusions: { staircase_m2: number; corridor_m2: number; mechanical_m2: number; total_exempt_m2: number; legal_ref: string };
  binding_constraint: string;
  typology: string;
}



interface Props {
  netArea: number | null;
  baseBd: number | null;
  coverage: number | null;
  maxFloors: number | null;
  maxHeight: number | null;
  bonusBdPct: number;
}

export default function BuildingMassing({ netArea, baseBd, coverage, maxFloors, maxHeight, bonusBdPct }: Props) {
  const [data, setData] = useState<MassingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [typology, setTypology] = useState("residential");
  const [verandaPct, setVerandaPct] = useState(25);
  const [floorH, setFloorH] = useState(3.0);

  useEffect(() => {
    if (!netArea || !baseBd || !coverage) return;
    setLoading(true);
    fetch(`${API}/api/zones/massing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        net_area: netArea,
        base_bd: baseBd,
        coverage,
        max_floors: maxFloors,
        max_height_m: maxHeight,
        veranda_pct: verandaPct / 100,
        floor_height_m: floorH,
        bonus_bd_pct: bonusBdPct,
        include_basement: true,
        typology,
      }),
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [netArea, baseBd, coverage, maxFloors, maxHeight, bonusBdPct, typology, verandaPct, floorH]);

  const b = data?.base_design;
  const bonus = data?.bonus_design;
  const stack = data?.floor_stack || [];
  const excl = data?.bd_exclusions;

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <ModuleHeader icon={<Building2 size={16} />} title="Module 3 — Building Massing (GFA / NIA / Floor Stack / 3D)" color="#6366F1"
        badge={b ? `${b.floors} Floors · ${b.achieved_gfa}m² GFA` : loading ? "Calculating..." : undefined}
        sub="Εντολή 4/2024 · BD Exclusions · Covered Verandas · Binding Constraint" />
      <div style={{ padding: 20 }}>
        {!netArea || !baseBd ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 20 }}>
            Αναζητήστε τεμάχιο για υπολογισμό Building Massing
          </div>
        ) : (
          <>
            {/* Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Τυπολογία</label>
                <select className="form-select" value={typology} onChange={e => setTypology(e.target.value)}>
                  <option value="residential">Κατοικία</option>
                  <option value="commercial">Εμπορικό</option>
                  <option value="mixed">Μικτό</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Βεράντα % ({verandaPct}%)</label>
                <input type="range" min={0} max={35} value={verandaPct} onChange={e => setVerandaPct(+e.target.value)}
                  style={{ width: "100%", accentColor: "var(--accent)", marginTop: 8 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Ύψος Ορόφου ({floorH}m)</label>
                <input type="range" min={2.7} max={4.5} step={0.1} value={floorH} onChange={e => setFloorH(+e.target.value)}
                  style={{ width: "100%", accentColor: "var(--accent)", marginTop: 8 }} />
              </div>
            </div>

            {loading && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 20 }}>Υπολογισμός μάζας...</div>}

            {b && (
              <>
                {/* 3D View */}
                <Building3DView
                  floors={b.floors}
                  footprint={b.max_footprint}
                  height={b.height_m}
                  gfa={b.achieved_gfa}
                  nia={b.nia_estimate}
                  veranda={b.covered_veranda}
                  coverage={coverage ?? 0.25}
                />

                {/* Key Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 16 }}>
                  <StatCard label="Net Developable" value={`${netArea?.toLocaleString("el-GR")} m²`} />
                  <StatCard label="GFA (Base)" value={`${b.achieved_gfa.toLocaleString("el-GR")} m²`} accent />
                  <StatCard label="NIA (est.)" value={`${b.nia_estimate.toLocaleString("el-GR")} m²`} />
                  <StatCard label="Covered Veranda" value={`${b.covered_veranda.toLocaleString("el-GR")} m²`} />
                  <StatCard label="Total Built Area" value={`${b.total_built_area.toLocaleString("el-GR")} m²`} />
                  <StatCard label="Efficiency" value={`${b.efficiency_pct}%`} />
                  <StatCard label="Max Footprint" value={`${b.max_footprint.toLocaleString("el-GR")} m²`} />
                  <StatCard label="Floors / Height" value={`${b.floors} / ${b.height_m}m`} />
                </div>

                {/* Bonus GFA from Incentives */}
                {bonus && bonus.extra_gfa > 0 && (
                  <div style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>BONUS GFA (από κίνητρα)</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>{bonus.achieved_gfa.toLocaleString("el-GR")} m²</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#10B981" }}>+{bonus.extra_gfa.toLocaleString("el-GR")} m² GFA</div>
                      <div style={{ fontSize: 12, color: "#10B981" }}>+{bonus.extra_nia.toLocaleString("el-GR")} m² NIA</div>
                    </div>
                  </div>
                )}

                {/* Floor Stack Table */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Floor Stack
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", padding: "8px 16px", fontSize: 10, color: "var(--text-muted)", fontWeight: 700, borderBottom: "1px solid var(--border)" }}>
                    <span>Level</span><span>Internal (m²)</span><span>Veranda</span><span>Total</span><span>Elev.</span>
                  </div>
                  {data?.basement && (
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", padding: "8px 16px", fontSize: 12, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.2)" }}>
                      <span>Basement</span>
                      <span style={{ fontFamily: "DM Mono, monospace" }}>{data.basement.area_m2}</span>
                      <span>—</span>
                      <span>{data.basement.area_m2}</span>
                      <span style={{ fontSize: 10, color: "#64748B" }}>−3m</span>
                    </div>
                  )}
                  {stack.map((f, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", padding: "8px 16px", fontSize: 12, color: "var(--text-secondary)", borderBottom: i < stack.length - 1 ? "1px solid var(--border)" : undefined }}>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{f.level}</span>
                      <span style={{ fontFamily: "DM Mono, monospace" }}>{f.internal_m2}</span>
                      <span style={{ color: "#6366F1" }}>{f.veranda_m2}</span>
                      <span style={{ fontWeight: 700 }}>{f.total_m2}</span>
                      <span style={{ color: "var(--accent)", fontSize: 11 }}>+{f.elevation_m}m</span>
                    </div>
                  ))}
                </div>

                {/* BD Exclusions */}
                {excl && (
                  <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>BD Exclusions — {excl.legal_ref}</div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--text-secondary)" }}>
                      <span>Staircase: <strong>{excl.staircase_m2} m²</strong></span>
                      <span>Corridor: <strong>{excl.corridor_m2} m²</strong></span>
                      <span>Mechanical: <strong>{excl.mechanical_m2} m²</strong></span>
                      <span style={{ color: "#6366F1", fontWeight: 700 }}>Total Exempt: {excl.total_exempt_m2} m²</span>
                    </div>
                  </div>
                )}

                {/* Binding Constraint */}
                {data?.binding_constraint && (
                  <div style={{ marginTop: 12, padding: "10px 16px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: "var(--text-muted)" }}>Binding Constraint: </span>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>{data.binding_constraint}</span>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
