"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  floors: number;
  footprint: number;   // max ground footprint m² (coverage × net)
  height: number;      // total height m
  gfa: number;         // total GFA m² (net × density)
  nia: number;
  veranda: number;
  coverage: number;    // 0.0–1.0
}

const CAM_PRESETS = {
  perspective: { pos: [18, 14, 18] as [number, number, number] },
  front:       { pos: [0, 8, 30]  as [number, number, number] },
  side:        { pos: [30, 8, 0]  as [number, number, number] },
  top:         { pos: [0, 35, 0.001] as [number, number, number] },
};

export default function Building3DView({ floors, footprint, height, gfa, nia, veranda, coverage }: Props) {
  const mountRef   = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef  = useRef<any>(null);
  const frameRef   = useRef<number>(0);
  const [view, setView] = useState<keyof typeof CAM_PRESETS>("perspective");

  // GFA per floor — Athena splits evenly (GFA / floors)
  const gfaPerFloor = Math.round(gfa / Math.max(floors, 1));

  // BD-exempt items (covered verandas, basement, mechanical)
  const bdExempt = Math.round(veranda * 0.15 + footprint * 0.08); // approx
  const totalBuilt = gfa + veranda;

  useEffect(() => {
    if (!mountRef.current) return;
    let mounted = true;

    import("three").then((THREE) => {
      if (!mounted || !mountRef.current) return;

      const el = mountRef.current;
      const W = el.clientWidth || 400;
      const H = 320;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x080c18);
      scene.fog = new THREE.Fog(0x080c18, 60, 100);

      // Camera
      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
      camera.position.set(...CAM_PRESETS.perspective.pos);
      camera.lookAt(0, height / 2, 0);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(W, H);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      el.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lighting — warm sun + cool fill (Athena palette)
      scene.add(new THREE.AmbientLight(0x334466, 0.7));
      const sun = new THREE.DirectionalLight(0xfff5e0, 1.4);
      sun.position.set(25, 40, 25);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0x2244bb, 0.35);
      fill.position.set(-15, 8, -15);
      scene.add(fill);

      // Ground grid
      const grid = new THREE.GridHelper(50, 25, 0x1a2a3a, 0x0e1a26);
      grid.position.y = -0.01;
      scene.add(grid);

      // Parcel ground (green footprint)
      const gGeo = new THREE.PlaneGeometry(10, 14);
      const gMat = new THREE.MeshLambertMaterial({ color: 0x1a3020, transparent: true, opacity: 0.55 });
      const ground = new THREE.Mesh(gGeo, gMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Parcel outline (teal, Athena style)
      const outGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(10.1, 0.02, 14.1));
      scene.add(new THREE.LineSegments(outGeo, new THREE.LineBasicMaterial({ color: 0x2DD4BF, linewidth: 2 })));

      // Building dims
      const bW = 6.5, bD = 9.0;
      const floorH = Math.max(0.5, height / Math.max(floors, 1));

      // Floor colors (gradient dark→teal, Athena palette)
      const FLOOR_COLORS = [0x1B5070, 0x1A6B5A, 0x2D7A6A, 0x3D7A4A, 0x5A6A3A, 0x6A5A30];

      // Basement slab
      const bsm = new THREE.Mesh(
        new THREE.BoxGeometry(bW, 0.8, bD),
        new THREE.MeshLambertMaterial({ color: 0x12202e })
      );
      bsm.position.y = -0.4;
      bsm.castShadow = true;
      scene.add(bsm);

      // Floors
      for (let f = 0; f < Math.min(floors, 8); f++) {
        const col = FLOOR_COLORS[Math.min(f, FLOOR_COLORS.length - 1)];
        const floorMesh = new THREE.Mesh(
          new THREE.BoxGeometry(bW, floorH * 0.94, bD),
          new THREE.MeshLambertMaterial({ color: col })
        );
        floorMesh.position.y = f * floorH + floorH * 0.47;
        floorMesh.castShadow = true;
        floorMesh.receiveShadow = true;
        scene.add(floorMesh);

        // Floor outline
        const edgeLines = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(bW, floorH * 0.94, bD)),
          new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.6 })
        );
        edgeLines.position.copy(floorMesh.position);
        scene.add(edgeLines);

        // Windows (front face)
        for (let w = 0; w < 4; w++) {
          const win = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, floorH * 0.42, 0.06),
            new THREE.MeshLambertMaterial({
              color: f % 2 === 0 ? 0x7DD3FC : 0x6EE7B7,
              emissive: f % 2 === 0 ? 0x1a4a7a : 0x1a5a3a,
              emissiveIntensity: 0.5,
            })
          );
          win.position.set(-1.6 + w * 1.07, f * floorH + floorH * 0.47, bD / 2 + 0.04);
          scene.add(win);
        }
      }

      // Roof cap (teal, Athena style)
      const roofH = 0.25;
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(bW, roofH, bD),
        new THREE.MeshLambertMaterial({ color: 0x2DD4BF, emissive: 0x0a4a4a, emissiveIntensity: 0.4 })
      );
      roof.position.y = floors * floorH + roofH / 2;
      roof.castShadow = true;
      scene.add(roof);

      // ── Orbit Controls (manual) ───────────────────────────────────────────
      let isDragging = false, lastX = 0, lastY = 0;
      let theta = Math.PI / 4, phi = Math.PI / 5.5, radius = 30;

      const updateCam = () => {
        const midH = (floors * floorH) / 2;
        camera.position.set(
          radius * Math.sin(theta) * Math.cos(phi),
          radius * Math.sin(phi),
          radius * Math.cos(theta) * Math.cos(phi)
        );
        camera.lookAt(0, midH, 0);
      };

      const canvas = renderer.domElement;
      canvas.addEventListener("mousedown", (e: MouseEvent) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = "grabbing"; });
      window.addEventListener("mouseup", () => { isDragging = false; canvas.style.cursor = "grab"; });
      canvas.addEventListener("mousemove", (e: MouseEvent) => {
        if (!isDragging) return;
        theta -= (e.clientX - lastX) * 0.012;
        phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, phi - (e.clientY - lastY) * 0.012));
        lastX = e.clientX; lastY = e.clientY;
        updateCam();
      });
      canvas.addEventListener("wheel", (e: WheelEvent) => {
        radius = Math.max(10, Math.min(60, radius + e.deltaY * 0.04));
        updateCam();
        e.preventDefault();
      }, { passive: false });

      // Animate
      const animate = () => {
        if (!mounted) return;
        frameRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();
    });

    return () => {
      mounted = false;
      cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.domElement?.parentNode?.removeChild(rendererRef.current.domElement);
        rendererRef.current = null;
      }
    };
  }, [floors, height, veranda, coverage]);

  // Camera preset buttons
  useEffect(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const pos = CAM_PRESETS[view].pos;
    cam.position.set(...pos);
    cam.lookAt(0, (floors * height / Math.max(floors, 1)) / 2, 0);
  }, [view, floors, height]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
      {/* LEFT: 3D Viewer */}
      <div>
        {/* Camera controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "#4B5680", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Camera</span>
          {(Object.keys(CAM_PRESETS) as Array<keyof typeof CAM_PRESETS>).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "3px 10px", fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: "pointer",
                background: view === v ? "#2DD4BF22" : "transparent",
                border: `1px solid ${view === v ? "#2DD4BF" : "#1e2d3d"}`,
                color: view === v ? "#2DD4BF" : "#4B5680",
                textTransform: "capitalize" }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <span style={{ fontSize: 10, color: "#1e2d3d", marginLeft: "auto" }}>Drag · Scroll</span>
        </div>
        <div ref={mountRef}
          style={{ width: "100%", height: 320, borderRadius: 10, overflow: "hidden", cursor: "grab",
            border: "1px solid rgba(45,212,191,0.15)" }} />
      </div>

      {/* RIGHT: GIA Schedule (Athena-style) */}
      <div style={{ background: "#0a1020", border: "1px solid #1a2535", borderRadius: 10, padding: "16px 18px",
        display: "flex", flexDirection: "column", gap: 0, fontSize: 12 }}>
        <div style={{ fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em",
          fontSize: 10, marginBottom: 12, borderBottom: "1px solid #1a2535", paddingBottom: 8 }}>
          GIA Floor Schedule
        </div>

        {/* Floor rows */}
        {Array.from({ length: floors }, (_, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "5px 0", borderBottom: "1px solid #0e1929" }}>
            <span style={{ color: "#64748B" }}>
              {i === 0 ? "Ground Floor" : i === 1 ? "1st Floor" : i === 2 ? "2nd Floor" : `${i}th Floor`}
            </span>
            <span style={{ fontFamily: "DM Mono,monospace", color: "#94A3B8", fontWeight: 600 }}>
              {gfaPerFloor.toLocaleString("el-GR")} m²
            </span>
          </div>
        ))}

        {/* TOTAL GFA */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0",
          borderBottom: "1px solid #1a2535", marginTop: 2 }}>
          <span style={{ color: "#94A3B8", fontWeight: 700 }}>TOTAL GFA</span>
          <span style={{ fontFamily: "DM Mono,monospace", color: "#2DD4BF", fontWeight: 800 }}>
            {Math.round(gfa).toLocaleString("el-GR")} m²
          </span>
        </div>

        {/* Verandas (excluded) */}
        {veranda > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
            borderBottom: "1px solid #0e1929" }}>
            <span style={{ color: "#6366F1" }}>Verandas</span>
            <span style={{ fontFamily: "DM Mono,monospace", color: "#6366F1", fontSize: 11 }}>
              {Math.round(veranda).toLocaleString("el-GR")} m² (excl.)
            </span>
          </div>
        )}

        {/* BD-Exempt */}
        {bdExempt > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
            borderBottom: "1px solid #0e1929" }}>
            <span style={{ color: "#8B5CF6" }}>BD-Exempt</span>
            <span style={{ fontFamily: "DM Mono,monospace", color: "#8B5CF6", fontSize: 11 }}>
              {bdExempt.toLocaleString("el-GR")} m² (excl.)
            </span>
          </div>
        )}

        {/* TOTAL BUILT */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", marginTop: 2 }}>
          <span style={{ color: "#F0F4FF", fontWeight: 800 }}>TOTAL BUILT</span>
          <span style={{ fontFamily: "DM Mono,monospace", color: "#F0F4FF", fontWeight: 800 }}>
            {Math.round(totalBuilt + bdExempt).toLocaleString("el-GR")} m²
          </span>
        </div>

        {/* NIA */}
        <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(45,212,191,0.06)",
          border: "1px solid rgba(45,212,191,0.2)", borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: "#2DD4BF", fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            NIA Estimate (82.2%)
          </div>
          <div style={{ fontFamily: "DM Mono,monospace", color: "#2DD4BF", fontWeight: 800, fontSize: 14 }}>
            {Math.round(nia).toLocaleString("el-GR")} m²
          </div>
        </div>
      </div>
    </div>
  );
}
