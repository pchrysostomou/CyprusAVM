"use client";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

export interface Village { code: string; name: string; }

// ─── Village Autocomplete ──────────────────────────────────────────────────
export function VillageSearch({ villages, value, onChange, disabled, loading }: {
  villages: Village[]; value: string;
  onChange: (name: string, code: string) => void;
  disabled: boolean; loading?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length >= 1
    ? villages.filter(v => v.name.toLowerCase().includes(query.toLowerCase())).slice(0, 12)
    : villages.slice(0, 12);

  useEffect(() => { if (!value) setQuery(""); }, [value]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input type="text" className="form-input" autoComplete="off"
        placeholder={disabled ? "Επιλέξτε επαρχία πρώτα..." : loading ? "Φόρτωση χωριών..." : "Πληκτρολογήστε χωριό/δήμο..."}
        disabled={disabled || loading} value={query} style={{ width: "100%", opacity: disabled ? 0.5 : 1 }}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange("", ""); }}
        onFocus={() => { if (!disabled && !loading) setOpen(true); }}
      />
      {open && !disabled && !loading && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999,
          background: "#0E1525", border: "1px solid rgba(45,212,191,.3)", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,.5)", maxHeight: 280, overflowY: "auto" }}>
          {filtered.map(v => (
            <button key={v.code} type="button" onClick={() => { setQuery(v.name); onChange(v.name, v.code); setOpen(false); }}
              style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "transparent",
                border: "none", borderBottom: "1px solid rgba(255,255,255,.06)", cursor: "pointer",
                fontSize: 13, color: "#F0F4FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,212,191,.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <span>{v.name}</span>
              <span style={{ fontSize: 11, color: "#4B5680", fontFamily: "DM Mono, monospace" }}>{v.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent, color }: { label: string; value: string; sub?: string; accent?: boolean; color?: string }) {
  const c = color || (accent ? "var(--accent)" : "var(--text-primary)");
  return (
    <div style={{ background: "var(--bg-secondary)", border: `1px solid ${accent ? "var(--border-accent)" : "var(--border)"}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: c, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── ModuleHeader ──────────────────────────────────────────────────────────
export function ModuleHeader({ icon, title, color = "var(--accent)", badge, sub }: { icon: React.ReactNode; title: string; color?: string; badge?: string; sub?: string }) {
  return (
    <div style={{ background: `color-mix(in srgb, ${color} 8%, transparent)`, borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color }}>{icon}</span>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
        </div>
        {sub && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, marginLeft: 26 }}>{sub}</p>}
      </div>
      {badge && <span style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>{badge}</span>}
    </div>
  );
}

// ─── ScoreBar ──────────────────────────────────────────────────────────────
export function ScoreBar({ label, score, weight, color }: { label: string; score: number; weight: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(score), 200); return () => clearTimeout(t); }, [score]);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{weight}%</span></span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 100, transition: "width 1s cubic-bezier(.34,1.56,.64,1)" }} />
      </div>
    </div>
  );
}

// ─── FindingRow ────────────────────────────────────────────────────────────
export function FindingRow({ type, text, tag }: { type: string; text: string; tag?: string }) {
  const config: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    favorable:  { icon: <CheckCircle size={13} />, color: "#10B981", label: "FAVORABLE" },
    warning:    { icon: <AlertTriangle size={13} />, color: "#FBBF24", label: "WARNING" },
    constraint: { icon: <XCircle size={13} />, color: "#F87171", label: "CONSTRAINT" },
    info:       { icon: <Info size={13} />, color: "#60A5FA", label: "INFO" },
  };
  const c = config[type] || config.info;
  return (
    <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
        <span style={{ color: c.color, flexShrink: 0 }}>{c.icon}</span>
        {text}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: c.color, letterSpacing: "0.06em" }}>{c.label}</span>
        {tag && <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>📍 {tag}</span>}
      </div>
    </div>
  );
}
