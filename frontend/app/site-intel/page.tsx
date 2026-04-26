"use client";
import { useState, useEffect } from "react";
import { Search, AlertTriangle, Building, CheckCircle, FileText, Activity } from "lucide-react";
import dynamic from "next/dynamic";
import { ModuleHeader, StatCard, VillageSearch, FindingRow, ScoreBar } from "./components";
import BuildingMassing from "./BuildingMassing";
import IncentivesEngine from "./IncentivesEngine";
import DevelopmentAppraisal from "./DevelopmentAppraisal";

const MapPanel = dynamic(() => import("./MapPanel"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DISTRICTS = [
  { value: "1", label: "1 - NICOSIA" },
  { value: "3", label: "3 - FAMAGUSTA" },
  { value: "4", label: "4 - LARNACA" },
  { value: "5", label: "5 - LIMASSOL" },
  { value: "6", label: "6 - PAFOS" },
];

export default function SiteIntelPage() {
  const [district, setDistrict] = useState("");
  const [villages, setVillages] = useState<any[]>([]);
  const [villageName, setVillageName] = useState("");
  const [villageCode, setVillageCode] = useState("");
  const [parcel, setParcel] = useState("");
  const [quarter, setQuarter] = useState("");
  const [block, setBlock] = useState("");
  const [titleDeedArea, setTitleDeedArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Results
  const [result, setResult] = useState<any>(null);
  const [zoneDB, setZoneDB] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [geojson, setGeojson] = useState<any>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [bonusBdPct, setBonusBdPct] = useState(0);

  useEffect(() => {
    if (!district) { setVillages([]); setVillageName(""); setVillageCode(""); return; }
    fetch(`${API}/api/dls/villages/${district}`)
      .then(r => r.json()).then(d => setVillages(d.villages || []))
      .catch(() => setVillages([]));
  }, [district]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageCode) { setError("Επιλέξτε χωριό/δήμο από τη λίστα."); return; }
    setError(null); setResult(null); setGeojson(null); setZoneDB(null); setAssessment(null);
    setLoading(true); setBonusBdPct(0);
    try {
      setLoadingStep("Αναζήτηση τεμαχίου...");
      const s = await fetch(`${API}/api/dls/search-parcel?dist_code=${district}&vil_code=${villageCode}&parcel_no=${parcel}&block_no=${block}&quarter=${quarter}`).then(r => r.json());
      if (!s.found) { setError("Δεν βρέθηκε τεμάχιο. Ελέγξτε τα στοιχεία."); setLoading(false); return; }

      setLoadingStep("Φόρτωση zone & αξίας...");
      const sbpiId = s.sbpi ? Math.round(s.sbpi) : s.objectid;
      const full = await fetch(`${API}/api/dls/full-parcel/${sbpiId}?dist_code=${district}&area_gis=${s.area_gis || 0}`).then(r => r.json());
      setResult(full);

      setMapLoading(true);
      setLoadingStep("Φόρτωση zone DB, assessment & χάρτη...");
      const [zoneData, assessData, mapData] = await Promise.allSettled([
        full.zoneCode ? fetch(`${API}/api/zones/lookup?zone_code=${encodeURIComponent(full.zoneCode)}&plan=`).then(r => r.json()) : Promise.resolve({ found: false }),
        fetch(`${API}/api/dls/land-assessment?dist_code=${district}&zone_code=${encodeURIComponent(full.zoneCode || "")}&is_field=${full.isField ?? false}&area_gis=${full.areaGIS || 0}&density=${full.density || 0}`).then(r => r.json()),
        fetch(`${API}/api/dls/parcel-geometry?dist_code=${district}&vil_code=${villageCode}&parcel_no=${parcel}&block_no=${block}&quarter=${quarter}`).then(r => r.json()),
      ]);
      if (zoneData.status === "fulfilled") setZoneDB(zoneData.value);
      if (assessData.status === "fulfilled") setAssessment(assessData.value);
      if (mapData.status === "fulfilled") setGeojson(mapData.value);
      setMapLoading(false);
    } catch (err) {
      setError("Σφάλμα επικοινωνίας. Δοκιμάστε ξανά.");
    } finally { setLoading(false); setLoadingStep(""); }
  };

  const effectiveBd = result?.density ?? (zoneDB?.found ? zoneDB.base_bd : null);
  const effectiveCoverage = result?.coverage ?? (zoneDB?.found ? zoneDB.coverage : null);
  const effectiveFloors = result?.maxFloors ?? (zoneDB?.found ? zoneDB.max_floors : null);
  const effectiveHeight = result?.maxHeight ?? (zoneDB?.found ? zoneDB.max_height_m : null);
  const area = titleDeedArea ? +titleDeedArea : (result?.areaOfficial || result?.areaGIS || 0);
  const d = result?.deductions;
  const netArea = result?.netArea ?? (d?.netDevelopableArea ?? null);
  const dlsVal = typeof result?.generalValuation2021 === "number" ? result.generalValuation2021 : null;
  const valPerSqm = result?.valuationPerSqm ?? null;
  const valSource = result?.valuationSource ?? null;
  const valNote = result?.valuationNote ?? null;
  const isFallback = valSource?.includes("Fallback");
  const gradeColor: Record<string, string> = { A: "#10B981", B: "#34D399", C: "#FBBF24", D: "#F87171", F: "#EF4444" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", padding: "24px 0" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 6px var(--success)", display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 700, letterSpacing: "0.06em" }}>LIVE · Cyprus Land Registry (DLS) · Site Score Engine · Real-Time</span>
              </div>
              <h1 style={{ fontSize: "clamp(18px,2.5vw,28px)", marginBottom: 4 }}>CyprusAVM — Site Intelligence Platform</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Site Score · Build Envelope Calculator · Uplift Mechanisms · Investment Analysis</p>
            </div>
            {result && (
              <button onClick={() => {
                const txt = `CyprusAVM Report\nSBPI: ${result.sbpi}\nZone: ${result.zoneCode}\nArea: ${Math.round(area)} m²\nGFA: ${netArea && effectiveBd ? Math.round(netArea * effectiveBd) : "—"} m²\nDLS 2021: ${dlsVal ? "€" + dlsVal.toLocaleString("el-GR") : "—"}\nDate: ${new Date().toLocaleDateString("el-GR")}`;
                const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
                a.download = `CyprusAVM_${result.sbpi}.txt`; a.click();
              }} className="btn btn-primary" style={{ gap: 8 }}>
                <FileText size={14} /> Export Report
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* MODULE 1: SEARCH */}
          <div className="card">
            <ModuleHeader icon={<Search size={15} />} title="Property Lookup — Cyprus Land Registry (DLS)" />
            <div style={{ padding: 20 }}>
              <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">District *</label>
                    <select value={district} onChange={e => { setDistrict(e.target.value); setResult(null); setError(null); }} required className="form-select">
                      <option value="">Select district...</option>
                      {DISTRICTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Village / Municipality *</label>
                    <VillageSearch villages={villages} value={villageName} disabled={!district} loading={false}
                      onChange={(n, c) => { setVillageName(n); setVillageCode(c); }} />
                    {villageCode && <div style={{ fontSize: 11, color: "var(--success)", marginTop: 3 }}>✓ {villageName} — code {villageCode}</div>}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Parcel No *</label>
                    <input value={parcel} onChange={e => setParcel(e.target.value)} required placeholder="e.g. 113" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quarter (Ενορία)</label>
                    <input value={quarter} onChange={e => setQuarter(e.target.value)} placeholder="e.g. 4" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Block (Τμήμα)</label>
                    <input value={block} onChange={e => setBlock(e.target.value)} placeholder="e.g. 2" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title Deed Area (m²)</label>
                    <input type="number" value={titleDeedArea} onChange={e => setTitleDeedArea(e.target.value)} placeholder="e.g. 4348" className="form-input" />
                  </div>
                </div>
                {error && <div style={{ padding: "10px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#F87171", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}><AlertTriangle size={14} />{error}</div>}
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontSize: 15, padding: "13px" }}>
                  {loading ? <><span className="spinner" /> {loadingStep}</> : <><Search size={16} /> Search &amp; Load Parcel</>}
                </button>
              </form>
            </div>
          </div>

          {result && (
            <>
              {/* PROPERTY RECORD */}
              <div className="card">
                <ModuleHeader icon={<Building size={15} />} title="Property Record" color="var(--accent)" badge={`SBPI: ${result.sbpi}`} />
                <div style={{ padding: 16 }}>
                  {/* Top stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 14 }}>
                    <StatCard label="Official Area" value={`${Math.round(area).toLocaleString("el-GR")} m²`} accent />
                    <StatCard label="GIS Area" value={`${Math.round(result.areaGIS || 0).toLocaleString("el-GR")} m²`} />
                    <StatCard label="Zone" value={result.zoneCode || "—"} accent={!!result.zoneCode} />
                    <StatCard label="Plan" value={zoneDB?.plan || "—"} />
                    <StatCard label="Density (BD)" value={effectiveBd != null ? `${(effectiveBd*100).toFixed(0)}%` : "—"} />
                    <StatCard label="Coverage" value={effectiveCoverage != null ? `${(effectiveCoverage*100).toFixed(0)}%` : "—"} />
                    <StatCard label="Floors" value={effectiveFloors != null ? String(effectiveFloors) : "—"} />
                    <StatCard label="Height" value={effectiveHeight != null ? `${effectiveHeight}m` : "—"} />
                  </div>
                  {/* Info row */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontFamily: "DM Mono,monospace", fontSize: 12, color: "var(--text-muted)" }}>DLS: Dist {district} | Vil {villageCode} | SBPI {result.sbpi}</span>
                    {result.isField === false && <span className="badge badge-success"><CheckCircle size={10} /> PLOT — Development Ready</span>}
                    {result.isField === true && <span className="badge badge-gold"><AlertTriangle size={10} /> FIELD (Χωράφι) — Subdivision Required</span>}
                    {result.accessType && <span className="badge badge-accent">{result.accessType}</span>}
                    {zoneDB?.found && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}>✓ Zone DB: {zoneDB.plan}</span>}
                    {result.sbpi && <a href={`https://www.dls.moi.gov.cy/index.php/el/services/eservices-dlss/89`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "underline" }}>Verify on DLS Portal ↗</a>}
                  </div>

                  {/* Land Deductions */}
                  {d && (
                    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", justifyContent: "space-between" }}>
                        <span>Land Deductions — {d.plan}</span>
                        <span style={{ color: "var(--error)" }}>−{d.totalPct}%</span>
                      </div>
                      {[
                        { label: "Gross Plot Area", value: `${d.grossArea.toLocaleString("el-GR")} m²`, bold: true, color: "var(--text-primary)" },
                        { label: `Road Network (${d.roadPct}%)`, value: `− ${d.roadDeduction.toLocaleString("el-GR")} m²`, color: "#F87171" },
                        { label: `Green Spaces (${d.greenPct}%)`, value: `− ${d.greenDeduction.toLocaleString("el-GR")} m²`, color: "#F87171" },
                        ...(d.communityPct > 0 ? [{ label: `Community (${d.communityPct}%)`, value: `− ${d.communityDeduction.toLocaleString("el-GR")} m²`, color: "#F87171", bold: false }] : []),
                        { label: "Net Developable Area", value: `${d.netDevelopableArea.toLocaleString("el-GR")} m²`, bold: true, color: "#10B981" },
                      ].map((row, i) => (
                        <div key={i} style={{ padding: "9px 14px", display: "flex", justifyContent: "space-between", borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.label}</span>
                          <span style={{ fontSize: 13, fontWeight: (row as any).bold ? 800 : 600, color: row.color, fontFamily: "DM Mono, monospace" }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* MAP */}
              <div className="card">
                <ModuleHeader icon={<Building size={15} />} title="Satellite Map — Cyprus Cadastral Registry"
                  badge={geojson?.features?.length > 0 ? "✓ Parcel Located" : mapLoading ? "Loading..." : "Awaiting parcel"} />
                <div style={{ padding: 12 }}>
                  <MapPanel key={result?.sbpi ?? "map"} geojson={geojson} loading={mapLoading} />
                </div>
              </div>

              {/* SITE SCORE */}
              {assessment && (
                <div className="card">
                  <ModuleHeader icon={<Activity size={15} />} title="Site Score — 5-Domain Land Assessment" color="#8B5CF6"
                    badge={`Grade ${assessment.grade} · ${assessment.harvestScore}/100`}
                    sub={`5 domains · ${assessment.layersChecked || 16} data layers`} />
                  <div style={{ padding: 16 }}>
                    {/* Score banner */}
                    <div style={{ display: "flex", gap: 20, alignItems: "center", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ textAlign: "center", minWidth: 90 }}>
                        <div style={{ fontSize: 48, fontWeight: 900, color: gradeColor[assessment.grade], lineHeight: 1 }}>{assessment.harvestScore}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>/ 100</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: gradeColor[assessment.grade] }}>Grade {assessment.grade}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        {[
                          { key: "zoning", label: "Ζώνη & Χρήσεις", w: 30 },
                          { key: "hazards", label: "Φυσικοί Κίνδυνοι", w: 25 },
                          { key: "environment", label: "Περιβάλλον", w: 20 },
                          { key: "infrastructure", label: "Υποδομές", w: 15 },
                          { key: "siteContext", label: "Site Context", w: 10 },
                        ].map(dom => (
                          <ScoreBar key={dom.key} label={dom.label} score={assessment.domains[dom.key]?.score ?? 0} weight={dom.w} color={gradeColor[assessment.grade]} />
                        ))}
                      </div>
                    </div>

                    {/* Domain findings */}
                    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                      {["zoning","hazards","environment","infrastructure","siteContext"].flatMap(k =>
                        [...(assessment.domains[k]?.findings || []), ...(assessment.domains[k]?.constraints || [])].map((f: any, i: number) =>
                          <FindingRow key={`${k}-${i}`} type={f.type} text={f.text} tag={f.tag} />
                        )
                      )}
                    </div>

                    {/* Environmental quick tags */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: assessment.pvProhibited ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${assessment.pvProhibited ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, color: assessment.pvProhibited ? "#F87171" : "#10B981" }}>
                        {assessment.pvProhibited ? "⚠ PV Prohibited" : "✓ PV Permitted"}
                      </span>
                      {assessment.seismic && (
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#FBBF24" }}>
                          Seismic Zone {assessment.seismic.zone} — PGA {assessment.seismic.pga}g (EC8)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BUILD ENVELOPE CALCULATOR */}
              <BuildingMassing
                netArea={netArea ?? null}
                baseBd={effectiveBd ?? null}
                coverage={effectiveCoverage ?? null}
                maxFloors={effectiveFloors ?? null}
                maxHeight={effectiveHeight ?? null}
                bonusBdPct={bonusBdPct}
              />

              {/* DEVELOPMENT UPLIFT — Bonus Mechanisms */}
              <IncentivesEngine
                zoneCode={result.zoneCode ?? null}
                zoneType={zoneDB?.zone_type}
                baseBd={effectiveBd ?? null}
                netArea={netArea ?? null}
                distCode={district}
                plan={zoneDB?.plan}
                onBonusChange={(pct) => setBonusBdPct(pct)}
              />

              {/* INVESTMENT ANALYSIS */}
              <DevelopmentAppraisal
                distCode={district}
                netArea={netArea ?? null}
                baseBd={effectiveBd ?? null}
                dlsValuation={dlsVal}
                gfa={netArea && effectiveBd ? Math.round(netArea * effectiveBd * (1 + bonusBdPct / 100)) : null}
                nia={netArea && effectiveBd ? Math.round(netArea * effectiveBd * (1 + bonusBdPct / 100) * 0.822) : null}
              />

              {/* LAND MARKET INDEX — DLS Valuation */}
              <div className="card card-glow">
                <ModuleHeader icon={<Building size={15} />}
                  title="Land Market Index — DLS General Valuation 2021"
                  color="var(--success)"
                  badge={dlsVal ? `€${dlsVal.toLocaleString("el-GR")}` : "Loading..."}
                  sub={valSource ?? "Cyprus DLS Official Benchmark"} />
                <div style={{ padding: 24 }}>
                  {dlsVal ? (
                    <>
                      {isFallback && (
                        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
                          borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 12,
                          color: "#F59E0B", display: "flex", alignItems: "center", gap: 6 }}>
                          ⚠️ DLS API Fallback — Αξία βάσει επαρχιακών μέσων DLS 2021
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 16 }}>
                        <StatCard label="Γενική Αξία 2021"
                          value={`€${dlsVal.toLocaleString("el-GR")}`} accent />
                        {valPerSqm && <StatCard label="Ανά m²" value={`€${valPerSqm.toLocaleString("el-GR")}/m²`} />}
                        <StatCard label="Επιφάνεια" value={`${area.toLocaleString("el-GR")} m²`} />
                        <StatCard label="Καθαρή Ανάπτυξιμη" value={netArea ? `${netArea.toLocaleString("el-GR")} m²` : "—"} />
                      </div>
                      {valNote && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(255,255,255,0.02)",
                          border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px",
                          lineHeight: 1.5 }}>
                          📄 {valNote}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 20 }}>
                      Φόρτωση αξίας...
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
