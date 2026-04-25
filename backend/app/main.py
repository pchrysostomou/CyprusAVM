from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from app.routers import estimate, comparables, market, dls

app = FastAPI(
    title="CyprusAVM API",
    description="Automated Valuation Model for Cyprus Real Estate",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
    "http://localhost:3001",
    "https://cyprusavm.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(estimate.router, prefix="/api", tags=["Valuation"])
app.include_router(comparables.router, prefix="/api", tags=["Comparables"])
app.include_router(market.router, prefix="/api", tags=["Market"])
app.include_router(dls.router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "CyprusAVM API",
        "version": "1.0.0",
    }


@app.get("/")
def root():
    return {
        "message": "CyprusAVM API — Automated Valuation Model for Cyprus Real Estate",
        "docs": "/docs",
    }
