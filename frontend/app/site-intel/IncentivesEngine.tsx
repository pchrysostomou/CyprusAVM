"use client";
import { useState, useEffect, useCallback } from "react";
import { ModuleHeader } from "./components";
import { Zap, Check, X, AlertTriangle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Mechanism {
  id: string; name: string; name_gr: string; type: string; category: string;
  bonus_pct: number; legal_basis: string; stacking: any; conditions: string[];
  parameters: any; reason_ineligible?: string;
}

interface Props {
  zoneCode: string | null; zoneType?: string; baseBd: number | null;
  netArea: number | null; distCode: string; plan?: string;
  onBonusChange: (pct: number, selectedIds: string[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  A: "BD Increases",
  B: "BD Exclusions (Entoli 4/2024)",
  C: "Indirect Optimisations",
  D: "Strategic Projects",
  G: "Financial Incentives",
};

const CATEGORY_COLORS: Record<string, string> = {
  A: "#10B981", B: "#6366F1", C: "#F59E0B", D: "#EF4444", G: "#60A5FA",
};

export default function IncentivesEngine({ zoneCode, zoneType, baseBd, netArea, distCode, plan, onBonusChange }: Props) {
  const [eligible, setEligible] = useState<Mechanism[]>([]);
  const [ineligible, setIneligible] = useState<Mechanism[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [totalBonus, setTotalBonus] = useState(0);

  useEffect(() => {
    if (!distCode) return;
    setLoading(true);
    const params = new URLSearchParams({
      zone_code: zoneCode || "",
      zone_type: zoneType || "",
      area_sqm: String(netArea || 0),
      base_bd: String(baseBd || 0),
      dist_code: distCode,
      plan: plan || "",
    });
    fetch(`${API}/api/zones/incentives?${params}`)
      .then(r => r.json())
      .then(d => {
        setEligible(d.eligible || []);
        setIneligible(d.ineligible || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [zoneCode, zoneType, baseBd, netArea, distCode, plan]);

  const calcBonus = useCallback((sel: Set<string>, mechs: Mechanism[]) => {
    // Stacking rules: housing_zone2/3 are exclusive; others additive up to cap
    let bonus = 0;
    let hasExclusive = false;
    const housing: Mechanism[] = [];
    const additive: Mechanism[] = [];

    for (const id of sel) {
      const m = mechs.find(x => x.id === id);
      if (!m) continue;
      if (m.stacking?.exclusive) { hasExclusive = true; housing.push(m); }
      else if (m.type === "bd_increase") additive.push(m);
    }

    if (hasExclusive) {
      // Only the exclusive housing bonus applies
      const maxExclusive = Math.max(...housing.map(m => m.bonus_pct));
      bonus = maxExclusive;
    } else {
      // Additive, with housing cap
      let housingBonus = 0;
      let otherBonus = 0;
      for (const m of additive) {
        const cap = m.stacking?.cap_pct;
        if (m.id.startsWith("housing")) { housingBonus = Math.min(housingBonus + m.bonus_pct, cap || 35); }
        else { otherBonus += m.bonus_pct; }
      }
      bonus = housingBonus + otherBonus;
    }
    return Math.round(bonus);
  }, []);

  const toggle = (id: string, mech: Mechanism) => {
    if (mech.type !== "bd_increase") return; // Only toggleable for BD increases
    const next = new Set(selected);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }

    // Handle exclusive: if selecting exclusive, deselect others in housing group
    if (mech.stacking?.exclusive && next.has(id)) {
      for (const existId of next) {
        const existM = eligible.find(m => m.id === existId);
        if (existId !== id && existM?.id?.startsWith("housing")) next.delete(existId);
      }
    }

    setSelected(next);
    const bonus = calcBonus(next, eligible);
    setTotalBonus(bonus);
    onBonusChange(bonus, Array.from(next));
  };

  const grouped = eligible.reduce((acc: Record<string, Mechanism[]>, m) => {
    const cat = m.category || "A";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <ModuleHeader icon={<Zap size={16} />} title="Development Uplift — Bonus Mechanisms & Incentives" color="#F59E0B"
        badge={totalBonus > 0 ? `+${totalBonus}% BD Active` : `${eligible.length} Eligible`}
        sub="Entoli 4/2024 · KDP 89/2015 · Housing 2025 · RES Order 4/2025 — Toggle to apply bonus" />
      <div style={{ padding: 20 }}>
        {loading && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 20 }}>Φόρτωση κινήτρων...</div>}

        {totalBonus > 0 && (
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "12px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Active BD Bonus</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#10B981" }}>+{totalBonus}%</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {Array.from(selected).join(", ")}
            </div>
          </div>
        )}

        {/* Eligible mechanisms by category */}
        {Object.entries(grouped).map(([cat, mechs]) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: CATEGORY_COLORS[cat] || "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: CATEGORY_COLORS[cat], display: "inline-block" }} />
              {CATEGORY_LABELS[cat] || `Category ${cat}`}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mechs.map(m => {
                const isToggleable = m.type === "bd_increase";
                const isSelected = selected.has(m.id);
                const isAlwaysOn = m.type === "bd_exclusion";

                return (
                  <div key={m.id} onClick={() => isToggleable && toggle(m.id, m)}
                    style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: isSelected ? "rgba(16,185,129,0.08)" : isAlwaysOn ? "rgba(99,102,241,0.05)" : "var(--bg-secondary)", border: `1px solid ${isSelected ? "rgba(16,185,129,0.3)" : isAlwaysOn ? "rgba(99,102,241,0.2)" : "var(--border)"}`, borderRadius: 10, cursor: isToggleable ? "pointer" : "default", transition: "all 0.2s" }}>
                    {/* Checkbox / indicator */}
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSelected ? "#10B981" : isAlwaysOn ? "#6366F1" : "var(--border)"}`, background: isSelected ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      {isSelected && <Check size={11} color="white" />}
                      {isAlwaysOn && <Check size={11} color="#6366F1" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{m.name}</span>
                          {m.name_gr && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{m.name_gr}</div>}
                        </div>
                        {m.bonus_pct > 0 && (
                          <span style={{ fontSize: 13, fontWeight: 800, color: CATEGORY_COLORS[m.category], background: `color-mix(in srgb, ${CATEGORY_COLORS[m.category]} 15%, transparent)`, padding: "2px 10px", borderRadius: 100, whiteSpace: "nowrap" }}>
                            +{m.bonus_pct}%
                          </span>
                        )}
                        {isAlwaysOn && <span style={{ fontSize: 10, color: "#6366F1", background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: 100 }}>ALWAYS ON</span>}
                      </div>
                      {m.legal_basis && <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>{m.legal_basis}</div>}
                      {m.conditions.length > 0 && (
                        <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-secondary)" }}>
                          {m.conditions.slice(0, 2).map((c, i) => <div key={i}>• {c}</div>)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Ineligible section */}
        {ineligible.filter(m => m.type === "bd_increase").length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Not Eligible for This Zone/Plot</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ineligible.filter(m => m.type === "bd_increase").map(m => (
                <div key={m.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 14px", background: "rgba(0,0,0,0.15)", border: "1px solid var(--border)", borderRadius: 8, opacity: 0.6 }}>
                  <X size={14} color="var(--text-muted)" />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.name}</span>
                    {m.reason_ineligible && <span style={{ fontSize: 11, color: "#F87171", marginLeft: 8 }}>— {m.reason_ineligible}</span>}
                  </div>
                  {m.bonus_pct > 0 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>+{m.bonus_pct}%</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
