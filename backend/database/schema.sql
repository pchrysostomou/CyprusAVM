-- CyprusAVM PostgreSQL Schema
-- Run: psql -U postgres -d cyprusavm -f schema.sql

CREATE EXTENSION IF NOT EXISTS postgis;

-- ====================
-- PROPERTIES TABLE
-- ====================
CREATE TABLE IF NOT EXISTS properties (
    id                  SERIAL PRIMARY KEY,
    source              VARCHAR(50) NOT NULL DEFAULT 'synthetic',
    is_actual_sale      BOOLEAN NOT NULL DEFAULT FALSE,
    listing_type        VARCHAR(20) DEFAULT 'resale',  -- 'resale', 'new_build', 'off_plan'

    -- Core characteristics
    price               INTEGER NOT NULL,
    area_sqm            INTEGER NOT NULL,
    price_per_sqm       DECIMAL GENERATED ALWAYS AS (price::decimal / NULLIF(area_sqm, 0)) STORED,
    property_type       VARCHAR(50),    -- 'apartment', 'house', 'villa', 'land'
    bedrooms            SMALLINT,
    bathrooms           SMALLINT,
    floor               SMALLINT,
    year_built          SMALLINT,
    total_floors        SMALLINT,

    -- Location
    district            VARCHAR(50),    -- 'lemesos', 'lefkosia', 'larnaka', 'pafos', 'ammochostos'
    municipality        VARCHAR(100),   -- 'Agía Zóni', 'Agios Tychonas', etc.
    address             TEXT,
    latitude            DECIMAL(10, 7),
    longitude           DECIMAL(10, 7),
    location            GEOGRAPHY(POINT, 4326),  -- PostGIS point

    -- Computed distance features (in km)
    distance_to_sea_km      DECIMAL(8, 3),
    distance_to_center_km   DECIMAL(8, 3),

    -- Boolean features
    has_parking         BOOLEAN DEFAULT FALSE,
    has_sea_view        BOOLEAN DEFAULT FALSE,
    has_pool            BOOLEAN DEFAULT FALSE,
    has_garden          BOOLEAN DEFAULT FALSE,
    has_title_deed      BOOLEAN DEFAULT TRUE,
    has_covered_parking BOOLEAN DEFAULT FALSE,
    is_corner_unit      BOOLEAN DEFAULT FALSE,
    is_tourist_area     BOOLEAN DEFAULT FALSE,

    -- Metadata
    listed_date         DATE,
    sale_date           DATE,
    agent_id            VARCHAR(50),
    url                 TEXT UNIQUE,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Spatial index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_location_gist ON properties USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_district ON properties(district);
CREATE INDEX IF NOT EXISTS idx_municipality ON properties(municipality);
CREATE INDEX IF NOT EXISTS idx_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_price_sqm ON properties(price_per_sqm);
CREATE INDEX IF NOT EXISTS idx_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_is_actual_sale ON properties(is_actual_sale);
CREATE INDEX IF NOT EXISTS idx_sale_date ON properties(sale_date);

-- ====================
-- MARKET STATS TABLE
-- ====================
CREATE TABLE IF NOT EXISTS market_stats (
    id              SERIAL PRIMARY KEY,
    district        VARCHAR(50) NOT NULL,
    municipality    VARCHAR(100),
    property_type   VARCHAR(50),
    period_month    DATE NOT NULL,  -- First day of month

    -- Aggregated stats
    median_price        INTEGER,
    avg_price           INTEGER,
    median_price_sqm    INTEGER,
    avg_price_sqm       INTEGER,
    transaction_count   INTEGER,
    avg_area_sqm        INTEGER,

    -- Trend vs previous period
    price_change_pct    DECIMAL(5, 2),

    computed_at         TIMESTAMP DEFAULT NOW(),

    UNIQUE(district, municipality, property_type, period_month)
);

CREATE INDEX IF NOT EXISTS idx_market_district ON market_stats(district, period_month);

-- ====================
-- MODEL RUNS TABLE
-- ====================
CREATE TABLE IF NOT EXISTS model_runs (
    id              SERIAL PRIMARY KEY,
    version         VARCHAR(20) NOT NULL,
    trained_at      TIMESTAMP DEFAULT NOW(),
    training_samples INTEGER,
    test_samples    INTEGER,
    mape            DECIMAL(5, 2),
    mae             INTEGER,
    r2_score        DECIMAL(5, 4),
    model_path      TEXT,
    is_production   BOOLEAN DEFAULT FALSE,
    notes           TEXT
);

-- ====================
-- ESTIMATE LOGS TABLE (for analytics)
-- ====================
CREATE TABLE IF NOT EXISTS estimate_logs (
    id              SERIAL PRIMARY KEY,
    session_id      VARCHAR(100),
    district        VARCHAR(50),
    municipality    VARCHAR(100),
    property_type   VARCHAR(50),
    area_sqm        INTEGER,
    estimated_price  INTEGER,
    confidence      VARCHAR(20),
    comparable_count INTEGER,
    ip_hash         VARCHAR(64),  -- hashed for privacy
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimate_logs_date ON estimate_logs(created_at);
