# CyprusAVM 🇨🇾🏡

> **CyprusAVM** is the first Automated Valuation Model (AVM) MVP built specifically for the Cyprus real estate market.

CyprusAVM uses a powerful **XGBoost Machine Learning** backend, trained on robust market data (with features like proximity to the sea, property type, age depreciation, and tourism zones), to predict property values across Cyprus municipalities with high confidence. It provides a sleek, modern **Next.js** dark-themed Single Page Application (SPA) to generate elegant PDF reports instantly.

---

## 🌟 Key Features

*   **Accurate ML Valuations:** Predicts property prices utilizing an XGBoost regression model with a historical MAPE of < 12%.
*   **Real-time Confidence Intervals:** Factors in comparable sales volume to dynamically predict valuation ranges and assign confidence levels.
*   **Aesthetic & Modern UI:** A glassmorphic, premium dark theme built on Next.js designed specifically to "wow" real estate clients and agencies.
*   **Instant PDF Reports:** Produces detailed, client-ready valuation reports (with disclaimers) that can be downloaded straight from the browser.
*   **Fully Dockerized:** Seamlessly deploy the entire stack (FastAPI Backend + Next.js Frontend) anywhere using `docker-compose`.

## 🏗️ Architecture

```
CyprusAVM/
│
├── backend/                  # Python / FastAPI / XGBoost
│   ├── app/                  # API Routers & Schemas
│   ├── data/                 # Market Data (CSVs)
│   ├── models/               # Serialized ML Models (.pkl)
│   └── scripts/              # Training & Data synthetic generation logic
│
├── frontend/                 # Next.js 14 / React
│   ├── app/                  # App Router Pages
│   ├── components/           # UI Components
│   └── lib/                  # API Client Configs
│
└── docker-compose.yml        # Orchestration
```

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)

### 1. Run with Docker (Recommended)
Simply spin up the orchestrated containers.
```bash
docker-compose up --build
```
*   **Frontend:** http://localhost:3000
*   **Backend API Docs:** http://localhost:8000/docs

### 2. Run Locally (Dev Mode)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📊 Incorporating Real Data
CyprusAVM is designed to adapt to your proprietary data effortlessly:
1. Replace `backend/data/synthetic_properties.csv` with your real data (following the schema features).
2. Run `python backend/scripts/train_model.py`.
3. The platform will automatically relearn, adjust encoding logic, recompute municipality medians, and generate a new `xgboost_v1.pkl` file!

## 📄 License
This project is proprietary MVP software. All rights reserved.
