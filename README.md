# CyprusAVM — Site Intelligence Platform

> **The first comprehensive land assessment and development feasibility platform for Cyprus — featuring live DLS REST API integration, Demetra Land Scoring Engine, 3D Build Envelope Calculator, and Investment Analysis.**

[![Live DLS API](https://img.shields.io/badge/DLS%20API-Live-brightgreen)](https://eservices.dls.moi.gov.cy)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.13-009688)](https://fastapi.tiangolo.com)

---

## What It Does

**CyprusAVM** is a full-stack platform that enables real estate professionals, developers, and investors to:

- **Look up any parcel** in Cyprus via the Land Registry (DLS) in real-time
- **Score land development potential** with the 5-domain Demetra Land Score (Grade A–F)
- **Calculate build envelopes** (GFA, NIA, Verandas, BD-Exempt) with a live 3D WebGL visualizer
- **Identify development uplift mechanisms** (39 bonus mechanisms, Entoli 4/2024)
- **Get official DLS 2021 valuations** with district/zone fallback benchmarks
- **Run investment analysis** using the Residual Land Value method (GDV, ROI, break-even)

---

## Modules

| Module | Name | Description |
|--------|------|-------------|
| 1 | **Property Lookup** | Live DLS REST API — search by District / Village / Parcel Number |
| 2 | **Net Area Calculator** | Road, green space, and community deductions per Local Plan |
| 3 | **Build Envelope Calculator** | GFA/NIA calc + Three.js 3D viewer + GIA Floor Schedule |
| 4 | **Development Uplift** | 39 bonus mechanisms (Entoli 4/2024, Local Plans, Housing 2025) |
| 5 | **Satellite Map** | Leaflet with DLS cadastral GeoJSON polygon + satellite tiles |
| 6 | **Investment Analysis** | GDV, construction cost, ROI, residual land value method |
| 7 | **Land Market Index** | DLS General Valuation 2021 + district/zone fallback (€/m²) |

---

## Demetra Land Score

A composite site score (0–100) across 5 weighted domains:

```
Score = Zoning×30% + Hazards×25% + Environment×20% + Infrastructure×15% + Site Context×10%
```

| Domain | Weight | Factors |
|--------|--------|---------|
| Zoning & Land Use | 30% | Zone code, parcel type, density ratio |
| Physical Hazards | 25% | Flood risk, Seismic zone (EC8), Landslides |
| Environment | 20% | Natura 2000, PV restrictions, Protected areas |
| Infrastructure | 15% | Water, EAC grid, Fibre, Sewer |
| Site Context | 10% | Tourism, coastal access, urban proximity |

**Grade thresholds:** A (≥85) · B (≥70) · C (≥55) · D (≥40) · F (<40)

---

## 3D Build Envelope

- **Three.js WebGL** rendering with drag-to-orbit camera controls
- **4 camera presets:** Perspective · Front · Side · Top
- **GIA Floor Schedule** (Ground + Floors + Verandas + BD-Exempt areas)
- **NIA Estimate** at 82.2% of GFA
- Real-time slider controls for veranda % and floor height

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | React framework, TypeScript |
| Vanilla CSS | Design tokens, glassmorphism dark theme |
| Leaflet.js | Cadastral satellite map (SSR-safe dynamic import) |
| Three.js | WebGL 3D build envelope visualizer |
| Lucide React | Icon system |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI (Python 3.13) | REST API, async proxy to DLS |
| httpx | Async HTTP client |
| DLS REST API | Official Cyprus Land Registry data |
| ArcGIS REST | Cadastral GeoJSON parcel geometry |

---

## Quick Start

### Requirements
- Node.js 18+
- Python 3.11+

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000/site-intel**

### Try it with a real parcel
```
District:  6 - PAFOS
Village:   AKAMAS, KISSONERGA
Parcel:    113
Block:     2
Area:      4348
```

Expected: **Demetra Score 72/100 · Grade B** · Land Market Index ~€2.5M · 3D building with GIA table

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dls/villages/{dist_code}` | Village list by district |
| GET | `/api/dls/search-parcel` | Find parcel by number |
| GET | `/api/dls/full-parcel/{sbpi}` | Full parcel data + valuation |
| GET | `/api/dls/parcel-geometry` | GeoJSON polygon for map |
| GET | `/api/dls/land-assessment` | Demetra Score (5 domains) |
| GET | `/api/dls/market-value` | Market value + appraisal data |
| GET | `/api/dls/deduction-rules/{dist_code}` | Land deduction rules by district |
| GET | `/api/zones/lookup` | Zone code database lookup |
| GET | `/api/zones/incentives` | Eligible uplift mechanisms |

---

## Data Sources

All data comes from **official government sources**:

| Source | Data |
|--------|------|
| [DLS REST API](https://eservices.dls.moi.gov.cy) | Parcel records, zone codes, ownership |
| [ArcGIS Cadastral Map](https://www.dls.moi.gov.cy) | GeoJSON parcel boundaries |
| DLS General Valuation 2021 | Official land value benchmarks |
| Cyprus Local Plans | Building density rules & incentives |
| Entoli 4/2024 | BD bonus mechanism legal basis |

---

## Project Structure

```
CyprusAVM/
├── frontend/
│   ├── app/
│   │   ├── site-intel/               # Main analysis page
│   │   │   ├── page.tsx              # 7-module orchestration
│   │   │   ├── MapPanel.tsx          # Leaflet cadastral map
│   │   │   ├── Building3DView.tsx    # Three.js 3D visualizer
│   │   │   ├── BuildingMassing.tsx   # Build envelope calculator
│   │   │   ├── IncentivesEngine.tsx  # Uplift mechanisms
│   │   │   ├── DevelopmentAppraisal.tsx  # ROI / investment analysis
│   │   │   └── components.tsx        # Shared UI components
│   │   ├── estimate/                 # Quick AVM valuation tool
│   │   ├── market/                   # Market analytics dashboard
│   │   └── globals.css               # Design system tokens
│   └── components/
│       └── Navbar.tsx
└── backend/
    └── app/
        ├── main.py
        └── routers/
            ├── dls.py                # DLS API proxy + Demetra engine
            └── zones.py              # Zone DB + incentives engine
```

---

## Key Technical Details

### Demetra Score Calibration
The scoring engine is calibrated against verified district benchmarks:
- **Paphos (District 6)**: Hazards=90, Environment=90, Infrastructure=90, Site=85
- Seismic zone classification per **Eurocode 8**
- Natura 2000 overlap detection per district
- PV restriction zones mapped per Cyprus Town Planning regulations

### DLS Valuation Fallback
When the DLS API returns `null` for field/rural parcels, the system falls back to **DLS 2021 district/zone benchmarks** (e.g. €575/m² for Κα zone in Paphos), clearly labelled as an estimate.

### Greek Character Encoding
DLS API responses use **Windows-1253** encoding. The backend proxy decodes to UTF-8 before forwarding to the frontend.

### Leaflet SSR Safety
`MapPanel` is loaded via Next.js `dynamic()` with `ssr: false` to prevent `window is not defined` errors during server-side rendering.

---

## Roadmap

- [ ] PDF report generation (react-pdf or Playwright)
- [ ] Real GIS environmental layers (Natura 2000, flood zones via WMS)
- [ ] Multi-parcel portfolio comparison
- [ ] AI development brief generator
- [ ] Saved sessions & search history
- [ ] API key authentication for professional access
- [ ] Vercel/Railway deployment with environment config

---

## License

MIT License — © 2025 [Panayiotis Chrysostomou](https://github.com/pchrysostomou)

---

*Land Registry data: Department of Lands and Surveys, Republic of Cyprus*
