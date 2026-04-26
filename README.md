# CyprusAVM — Site Intelligence Platform

> **The first comprehensive land assessment and development feasibility platform for Cyprus — featuring live DLS REST API integration, 5-Domain Site Scoring Engine, 3D Build Envelope Calculator, and Investment Analysis.**

[![Live DLS API](https://img.shields.io/badge/DLS%20API-Live-brightgreen)](https://eservices.dls.moi.gov.cy)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.13-009688)](https://fastapi.tiangolo.com)

---

## What It Does

**CyprusAVM** is a full-stack platform that enables real estate professionals, developers, and investors to:

- **Look up any parcel** in Cyprus via the Land Registry (DLS) in real-time
- **Score land development potential** with the 5-domain Site Score engine (Grade A–F)
- **Calculate build envelopes** (GFA, NIA, Verandas, BD-Exempt) with a live 3D WebGL visualizer
- **Identify development uplift mechanisms** (39 bonus mechanisms, Entoli 4/2024)
- **Get official DLS 2021 valuations** with district/zone fallback benchmarks
- **Run investment analysis** using the Residual Land Value method (GDV, ROI, break-even)

---

## Modules

| # | Name | Description |
|---|------|-------------|
| 1 | **Property Lookup** | Live DLS REST API — search by District / Village / Parcel Number |
| 2 | **Net Area Calculator** | Road, green space, and community deductions per Local Plan |
| 3 | **Build Envelope Calculator** | GFA/NIA calc + Three.js 3D viewer + GIA Floor Schedule |
| 4 | **Development Uplift** | 39 bonus mechanisms (Entoli 4/2024, Local Plans, Housing 2025) |
| 5 | **Satellite Map** | Leaflet with DLS cadastral GeoJSON polygon + satellite tiles |
| 6 | **Investment Analysis** | GDV, construction cost, ROI, residual land value method |
| 7 | **Land Market Index** | DLS General Valuation 2021 + district/zone fallback (€/m²) |

---

## Site Score

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

**Grades:** A (≥85) · B (≥70) · C (≥55) · D (≥40) · F (<40)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | React framework, TypeScript |
| Vanilla CSS | Design tokens, dark theme |
| Leaflet.js | Cadastral satellite map |
| Three.js | WebGL 3D build envelope visualizer |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI (Python 3.13) | REST API, async proxy to DLS |
| httpx | Async HTTP client |
| DLS REST API | Official Cyprus Land Registry data |

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

## Roadmap

- [ ] PDF report — structured one-click export (in progress)
- [ ] Live GIS environmental layers (Natura 2000, flood zones via WMS)
- [ ] Multi-parcel portfolio comparison
- [ ] AI-powered development brief generator
- [ ] Saved sessions & search history
- [ ] API key authentication for professional access
- [ ] Cloud deployment (Vercel + Railway)

---

## Known Limitations

> **PDF Export** — The one-click PDF report feature is not yet implemented. Currently the platform exports a basic `.txt` summary. A full structured PDF report is planned for a future release.

---
