"use client";
import { useEffect, useRef, useState } from "react";

interface MapPanelProps {
  geojson: GeoJSON.FeatureCollection | null;
  loading?: boolean;
}

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const ENV = [
  { id: "flood", label: "Flood 100yr", color: "#3B82F6" },
  { id: "seismic", label: "Seismic", color: "#F59E0B" },
  { id: "natura", label: "Natura 2000", color: "#10B981" },
  { id: "pv", label: "PV Prohibited", color: "#EF4444" },
  { id: "beach", label: "Beach Protect", color: "#06B6D4" },
];

export default function MapPanel({ geojson, loading }: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const baseTileRef = useRef<any>(null);
  const pendingGeojson = useRef(geojson);     // ← always current
  pendingGeojson.current = geojson;

  const [satellite, setSatellite] = useState(true);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());

  function drawParcel(L: any, map: any, gj: any) {
    if (layerRef.current) { try { layerRef.current.remove(); } catch {} layerRef.current = null; }
    if (!gj?.features?.length) return;
    const layer = L.geoJSON(gj, {
      style: { color: "#2DD4BF", weight: 3.5, opacity: 1, fillColor: "#2DD4BF", fillOpacity: 0.2 },
    }).addTo(map);
    layerRef.current = layer;
    try {
      const b = layer.getBounds();
      if (b.isValid()) {
        map.invalidateSize();
        map.fitBounds(b, { padding: [50, 50], maxZoom: 18 });
      }
    } catch (e) { console.warn("fitBounds", e); }
  }

  // Init Leaflet — runs once on mount
  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el || (el as any)._leaflet_id) return;

    import("leaflet").then(mod => {
      if (cancelled || !containerRef.current || (containerRef.current as any)._leaflet_id) return;
      const L = (mod as any).default ?? mod;
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(containerRef.current, {
        center: [34.9, 33.2], zoom: 9,
        zoomControl: true, attributionControl: false,
      });

      const tile = L.tileLayer(satellite ? ESRI : DARK, { maxZoom: 20 });
      tile.addTo(map);
      baseTileRef.current = tile;
      mapRef.current = { map, L };

      // Draw whatever geojson was pending at mount time
      map.whenReady(() => {
        if (pendingGeojson.current) {
          drawParcel(L, map, pendingGeojson.current);
        }
      });
    });

    return () => {
      cancelled = true;
      if (mapRef.current?.map) {
        try { mapRef.current.map.remove(); } catch {}
        mapRef.current = null;
        baseTileRef.current = null;
        layerRef.current = null;
      }
    };
  }, []); // eslint-disable-line

  // Redraw parcel when geojson prop changes AFTER mount
  useEffect(() => {
    if (!mapRef.current) return;   // not mounted yet — whenReady handles it
    const { L, map } = mapRef.current;
    drawParcel(L, map, geojson);
  }, [geojson]);

  // Toggle basemap
  useEffect(() => {
    if (!mapRef.current) return;
    const { L, map } = mapRef.current;
    if (baseTileRef.current) { try { baseTileRef.current.remove(); } catch {} }
    const t = L.tileLayer(satellite ? ESRI : DARK, { maxZoom: 20 }).addTo(map);
    baseTileRef.current = t;
    if (layerRef.current) try { layerRef.current.bringToFront(); } catch {}
  }, [satellite]);

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#0d1117", minHeight: 440 }}>
      {/* Basemap toggle */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
        <button onClick={() => setSatellite(s => !s)}
          style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, borderRadius: 8,
            background: "rgba(8,12,24,0.92)", border: "1px solid rgba(45,212,191,0.5)",
            color: "#2DD4BF", cursor: "pointer", backdropFilter: "blur(6px)" }}>
          {satellite ? "🌍 Satellite" : "🌑 Dark"}
        </button>
      </div>

      {/* Environmental layer toggles */}
      <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 1000, display: "flex", gap: 5, flexWrap: "wrap" }}>
        {ENV.map(l => {
          const on = activeLayers.has(l.id);
          return (
            <button key={l.id}
              onClick={() => setActiveLayers(p => { const n = new Set(p); on ? n.delete(l.id) : n.add(l.id); return n; })}
              style={{ padding: "3px 9px", fontSize: 10, fontWeight: 700, borderRadius: 6,
                background: on ? l.color + "22" : "rgba(8,12,24,0.88)",
                border: `1px solid ${on ? l.color : "rgba(255,255,255,0.1)"}`,
                color: on ? l.color : "rgba(255,255,255,0.35)", cursor: "pointer" }}>
              {on ? "✓ " : ""}{l.label}
            </button>
          );
        })}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{ position: "absolute", inset: 0, zIndex: 999, background: "rgba(8,12,24,0.88)",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
          <div style={{ width: 28, height: 28, border: "2px solid rgba(45,212,191,0.15)",
            borderTopColor: "#2DD4BF", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <span style={{ fontSize: 13, color: "#94A3B8" }}>Loading map...</span>
        </div>
      )}

      {/* Empty state */}
      {!geojson && !loading && (
        <div style={{ position: "absolute", inset: 0, zIndex: 5,
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 32 }}>🗺️</span>
          <span style={{ fontSize: 13, color: "#4B5680" }}>Map displays after search</span>
        </div>
      )}

      <div ref={containerRef} style={{ width: "100%", height: 440 }} />
    </div>
  );
}
