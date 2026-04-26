# CyprusAVM — Αυτοματοποιημένη Εκτίμηση & Ανάλυση Βιωσιμότητας Ακινήτων Κύπρου

> **Το πρώτο ολοκληρωμένο σύστημα κτηματολογικής ανάλυσης και εκτίμησης βιωσιμότητας ανάπτυξης για την Κύπρο — με live ενσωμάτωση DLS REST API, Demetra Scoring Engine, 3D Building Massing και Development Appraisal.**

---

## 🏗️ Τι Είναι

Το **CyprusAVM** είναι μια full-stack web εφαρμογή που επιτρέπει σε επαγγελματίες του real estate, developers και επενδυτές να:

- **Εντοπίσουν οποιοδήποτε τεμάχιο** στην Κύπρο μέσω του Κτηματολογίου (DLS) real-time
- **Αναλύσουν την αναπτυξιακή βιωσιμότητα** με 5-domain Demetra Scoring Engine (Grade A–F)
- **Υπολογίσουν το κτηριακό μάζωμα** (GFA, NIA, Verandas, BD-Exempt) με 3D visualization
- **Αξιολογήσουν κίνητρα ανάπτυξης** (39 μηχανισμοί, Εντολή 4/2024)
- **Λάβουν εκτίμηση DLS 2021** με fallback district/zone benchmarks
- **Δουν χρηματοοικονομική ανάλυση** (ROI, GDV, Development Cost)

---

## 🧩 Modules

| # | Module | Περιγραφή |
|---|--------|-----------|
| 1 | **Parcel Search** | Live DLS REST API — αναζήτηση με Επαρχία / Χωριό / Αριθμό Τεμαχίου |
| 2 | **Land Deductions** | Αφαιρέσεις Δρόμων, Πρασίνου, Κοινότητας per Τοπικό Σχέδιο |
| 3 | **Building Massing** | GFA/NIA υπολογισμός + Three.js 3D Viewer + GIA Floor Schedule |
| 4 | **Incentives Engine** | 39 μηχανισμοί αύξησης ΣΔ (Εντολή 4/2024, Τοπικά Σχέδια) |
| 5 | **Cadastral Map** | Leaflet satellite map με GeoJSON polygon τεμαχίου |
| 6 | **Development Appraisal** | GDV, κόστος ανάπτυξης, ROI, break-even ανάλυση |
| 7 | **DLS Valuation** | Γενική Εκτίμηση 2021 + District/Zone fallback benchmarks |

---

## 🎯 Demetra Scoring Engine

Σύνθετη βαθμολογία (0–100) σε 5 domains:

```
Harvest Score = Ζώνη×30% + Κίνδυνοι×25% + Περιβάλλον×20% + Υποδομές×15% + Περιοχή×10%
```

| Domain | Βάρος | Παράγοντες |
|--------|-------|------------|
| Ζώνη & Χρήσεις | 30% | Zone code, τύπος τεμαχίου, πυκνότητα |
| Φυσικοί Κίνδυνοι | 25% | Πλημμύρα, Σεισμός (EC8), Κατολισθήσεις |
| Περιβάλλον | 20% | Natura 2000, ΦΒ Απαγόρευση, Προστατευόμενες Ζώνες |
| Υποδομές | 15% | Νερό, ΑΗΚ, Οπτική Ίνα, Αποχέτευση |
| Περιοχή | 10% | Τουρισμός, Πρόσβαση, Αστική Εγγύτητα |

---

## 🗺️ Χάρτης & 3D

- **Leaflet** satellite/dark tile switcher με GeoJSON parcel overlay
- **Three.js WebGL** 3D building massing:
  - Drag-to-orbit camera controls
  - Perspective / Front / Side / Top views
  - Real-time GIA Floor Schedule (Ground + Floors + Verandas + BD-Exempt)
  - NIA Estimate (82.2%)

---

## ⚙️ Tech Stack

### Frontend
| | |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Vanilla CSS (design tokens, glassmorphism dark theme) |
| Map | Leaflet.js (dynamic SSR-safe import) |
| 3D | Three.js (dynamic import, WebGL renderer) |
| Icons | Lucide React |

### Backend
| | |
|---|---|
| Framework | FastAPI (Python 3.13) |
| HTTP Client | httpx (async) |
| Data Sources | DLS REST API, ArcGIS Cadastral Map |
| Encoding | windows-1253 → UTF-8 fix για Greek text |

---

## 🚀 Quick Start

### Προαπαιτούμενα
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

Άνοιξε **http://localhost:3000/feasibility**

---

## 📡 API Endpoints

| Endpoint | Περιγραφή |
|----------|-----------|
| `GET /api/dls/villages/{dist_code}` | Λίστα χωριών ανά επαρχία |
| `GET /api/dls/search-parcel` | Αναζήτηση τεμαχίου |
| `GET /api/dls/full-parcel/{sbpi}` | Πλήρη δεδομένα τεμαχίου + αξία |
| `GET /api/dls/parcel-geometry` | GeoJSON geometry για χάρτη |
| `GET /api/dls/land-assessment` | Demetra Scoring (5 domains) |
| `GET /api/dls/market-value` | Market value + development appraisal |
| `GET /api/dls/deduction-rules/{dist_code}` | Κανόνες αφαιρέσεων ανά επαρχία |

---

## 🏛️ Δεδομένα

Όλα τα δεδομένα προέρχονται από **επίσημες κυβερνητικές πηγές**:

- **[DLS REST API](https://eservices.dls.moi.gov.cy)** — Τμήμα Κτηματολογίου & Χωρομετρίας
- **[ArcGIS Cadastral Map](https://www.dls.moi.gov.cy)** — GeoJSON boundaries
- **DLS Γενική Εκτίμηση 2021** — Επίσημες αξίες ακινήτων
- **Τοπικά Σχέδια Κύπρου** — Κανόνες Δόμησης & Κίνητρα

---

## 📁 Δομή Project

```
CyprusAVM/
├── frontend/
│   ├── app/
│   │   ├── feasibility/          # Κύρια σελίδα ανάλυσης
│   │   │   ├── page.tsx          # 7 modules orchestration
│   │   │   ├── MapPanel.tsx      # Leaflet cadastral map
│   │   │   ├── Building3DView.tsx # Three.js 3D massing
│   │   │   ├── BuildingMassing.tsx
│   │   │   ├── IncentivesEngine.tsx
│   │   │   ├── DevelopmentAppraisal.tsx
│   │   │   └── components.tsx    # Shared UI components
│   │   ├── estimate/             # Quick valuation tool
│   │   ├── market/               # Market analytics
│   │   └── globals.css           # Design system tokens
│   └── components/
│       └── Navbar.tsx
└── backend/
    └── app/
        ├── main.py
        └── routers/
            └── dls.py            # All DLS API integrations
```

---

## 🔮 Roadmap

- [ ] PDF Report generation (react-pdf)
- [ ] Real-time GIS environmental layers (Natura 2000, Flood zones)
- [ ] Multi-parcel comparison
- [ ] AI-powered development brief generator
- [ ] Saved sessions & history
- [ ] API key authentication for professional access

---

## 📄 License

MIT License — © 2025 [Panayiotis Chrysostomou](https://github.com/pchrysostomou)

---

*Δεδομένα DLS: Τμήμα Κτηματολογίου & Χωρομετρίας, Κυπριακή Δημοκρατία*
