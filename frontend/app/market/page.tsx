"use client";
import { useState, useEffect } from "react";
import { getMarketStats, formatEuro, formatPct, type MarketStats } from "@/lib/api";

const DISTRICTS = [
  { value: "lemesos", label: "Λεμεσός" },
  { value: "lefkosia", label: "Λευκωσία" },
  { value: "larnaka", label: "Λάρνακα" },
  { value: "pafos", label: "Πάφος" },
];

function MiniChart({ data }: { data: { month: string; median_price_sqm: number }[] }) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data.map((d) => d.median_price_sqm));
  const max = Math.max(...data.map((d) => d.median_price_sqm));
  const range = max - min || 1;

  const width = 400;
  const height = 80;
  const padding = 4;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - ((d.median_price_sqm - min) / range) * (height - padding * 2),
  }));

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 80 }}>
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chart-fill)" />
      <path d={pathD} fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="4"
        fill="#2DD4BF"
      />
    </svg>
  );
}

export default function MarketPage() {
  const [selected, setSelected] = useState("lemesos");
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMarketStats(selected)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected]);

  const priceTrend = stats?.price_change_pct ?? 0;
  const trendPositive = priceTrend >= 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "40px 0 32px",
        }}
      >
        <div className="container">
          <div className="badge badge-gold" style={{ marginBottom: 12 }}>
            Αγορά Ακινήτων Κύπρου
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 8 }}>
            Στατιστικά Αγοράς
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 24 }}>
            Τιμές, τάσεις και όγκος αγοραπωλησιών ανά επαρχία
          </p>

          {/* District tabs */}
          <div style={{ display: "flex", gap: 6 }}>
            {DISTRICTS.map((d) => (
              <button
                key={d.value}
                id={`district-tab-${d.value}`}
                className={`toggle-btn ${selected === d.value ? "active" : ""}`}
                onClick={() => setSelected(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 24,
              background: "var(--error-dim)",
              borderRadius: 12,
              textAlign: "center",
              color: "var(--error)",
            }}
          >
            ⚠ {error}
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>
              Βεβαιώσου ότι το backend τρέχει και έχεις τρέξει τα scripts
            </div>
          </div>
        )}

        {stats && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* KPI row */}
            <div className="grid-4">
              {[
                {
                  label: "Διάμεση Τιμή/τμ",
                  value: `€${stats.median_price_sqm.toLocaleString("el-GR")}`,
                  sub: "Βασισμένο σε πωλήσεις",
                  accent: true,
                },
                {
                  label: "Μέση Τιμή/τμ",
                  value: `€${stats.avg_price_sqm.toLocaleString("el-GR")}`,
                  sub: "Weighted average",
                  accent: false,
                },
                {
                  label: "Αλλαγή Τιμής YoY",
                  value: formatPct(priceTrend),
                  sub: "Vs τελευταίο έτος",
                  accent: false,
                  color: trendPositive ? "var(--success)" : "var(--error)",
                },
                {
                  label: "Αγοραπωλησίες (dataset)",
                  value: stats.transaction_count.toLocaleString("el-GR"),
                  sub: `Επαρχία ${DISTRICTS.find((d) => d.value === selected)?.label}`,
                  accent: false,
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className={`card ${kpi.accent ? "card-glow" : ""}`}
                  style={{ padding: 24 }}
                >
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {kpi.label}
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      color: kpi.color ?? (kpi.accent ? "var(--accent)" : "var(--text-primary)"),
                    }}
                  >
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    {kpi.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Price trend chart */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 16, marginBottom: 4 }}>Τάση Τιμής / τμ</h2>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Τελευταίοι 12 μήνες</p>
                </div>
                <span
                  className={`badge ${trendPositive ? "badge-success" : "badge-error"}`}
                >
                  {formatPct(priceTrend)} YoY
                </span>
              </div>

              <MiniChart data={stats.price_trend_12m} />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                <span>{stats.price_trend_12m[0]?.month}</span>
                <span>{stats.price_trend_12m[stats.price_trend_12m.length - 1]?.month}</span>
              </div>
            </div>

            {/* Property type breakdown + Municipality breakdown */}
            <div className="grid-2">
              {/* By type */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, marginBottom: 16 }}>Ανά Τύπο Ακινήτου</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(stats.breakdown_by_type).map(([type, data]) => {
                    const label =
                      type === "apartment" ? "Διαμέρισμα" : type === "house" ? "Κατοικία" : "Βίλα";
                    const maxSqm = Math.max(
                      ...Object.values(stats.breakdown_by_type).map((d) => d.median_price_sqm)
                    );
                    const pct = (data.median_price_sqm / maxSqm) * 100;

                    return (
                      <div key={type}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                            fontSize: 14,
                          }}
                        >
                          <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                          <span style={{ fontWeight: 700 }}>
                            €{data.median_price_sqm.toLocaleString()}/τμ
                          </span>
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: "var(--bg-glass)",
                            borderRadius: 100,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: "var(--gradient-accent)",
                              borderRadius: 100,
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                          {data.count} αγοραπωλησίες
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By municipality */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, marginBottom: 16 }}>Ανά Συνοικία / Περιοχή</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stats.municipalities.map((m, i) => (
                    <div
                      key={m.name}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto auto",
                        gap: 12,
                        padding: "10px 14px",
                        background: i === 0 ? "var(--accent-dim)" : "var(--bg-glass)",
                        borderRadius: 8,
                        border: i === 0 ? "1px solid var(--border-accent)" : "1px solid transparent",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: i === 0 ? 600 : 400 }}>
                        {m.name}
                        {i === 0 && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: "var(--accent)" }}>
                            #1
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: i === 0 ? "var(--accent)" : "var(--text-primary)",
                        }}
                      >
                        €{m.median_price_sqm.toLocaleString()}/τμ
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {m.count} πωλήσεις
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Period info */}
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
              Δεδομένα ενημερωμένα: {stats.period} · Βασισμένα σε synthetic dataset για demo
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
