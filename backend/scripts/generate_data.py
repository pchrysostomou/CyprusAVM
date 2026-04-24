"""
CyprusAVM — Synthetic Data Generator
Generates 2,000+ realistic Cyprus property listings focused on Lemesos.
Prices are calibrated to actual Cyprus market conditions (2024-2025).
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime, date, timedelta
import os

random.seed(42)
np.random.seed(42)

# ====================
# MARKET DATA (real Cyprus prices 2024-2025)
# ====================

MUNICIPALITIES = {
    "lemesos": {
        "Agía Zóni": {
            "base_sqm": 2400,
            "sea_pct": 0.55,
            "lat_range": (34.672, 34.685),
            "lon_range": (33.038, 33.055),
            "weight": 0.15,
        },
        "Agios Tychonas": {
            "base_sqm": 3800,
            "sea_pct": 0.70,
            "lat_range": (34.700, 34.720),
            "lon_range": (33.080, 33.110),
            "weight": 0.08,
        },
        "Germasogeia": {
            "base_sqm": 2900,
            "sea_pct": 0.45,
            "lat_range": (34.700, 34.720),
            "lon_range": (33.065, 33.090),
            "weight": 0.10,
        },
        "Mesa Geitonia": {
            "base_sqm": 1900,
            "sea_pct": 0.10,
            "lat_range": (34.680, 34.695),
            "lon_range": (33.040, 33.060),
            "weight": 0.12,
        },
        "Kato Polemidia": {
            "base_sqm": 1500,
            "sea_pct": 0.05,
            "lat_range": (34.685, 34.700),
            "lon_range": (33.000, 33.025),
            "weight": 0.10,
        },
        "Ypsonas": {
            "base_sqm": 1350,
            "sea_pct": 0.02,
            "lat_range": (34.700, 34.715),
            "lon_range": (32.990, 33.010),
            "weight": 0.08,
        },
        "Potamos Germasogeias": {
            "base_sqm": 2200,
            "sea_pct": 0.60,
            "lat_range": (34.695, 34.710),
            "lon_range": (33.055, 33.075),
            "weight": 0.07,
        },
        "Zakaki": {
            "base_sqm": 1600,
            "sea_pct": 0.20,
            "lat_range": (34.680, 34.695),
            "lon_range": (33.015, 33.035),
            "weight": 0.06,
        },
        "Polemidia": {
            "base_sqm": 1700,
            "sea_pct": 0.05,
            "lat_range": (34.690, 34.705),
            "lon_range": (33.005, 33.030),
            "weight": 0.07,
        },
        "Pyrgos": {
            "base_sqm": 2600,
            "sea_pct": 0.65,
            "lat_range": (34.710, 34.725),
            "lon_range": (33.095, 33.115),
            "weight": 0.05,
        },
        "Episkopi": {
            "base_sqm": 1800,
            "sea_pct": 0.30,
            "lat_range": (34.660, 34.675),
            "lon_range": (32.900, 32.930),
            "weight": 0.05,
        },
        "Mouttagiaka": {
            "base_sqm": 3200,
            "sea_pct": 0.75,
            "lat_range": (34.705, 34.720),
            "lon_range": (33.070, 33.090),
            "weight": 0.07,
        },
    },
    "lefkosia": {
        "Engomi": {
            "base_sqm": 2100,
            "sea_pct": 0.00,
            "lat_range": (35.168, 35.185),
            "lon_range": (33.338, 33.360),
            "weight": 0.30,
        },
        "Strovolos": {
            "base_sqm": 1800,
            "sea_pct": 0.00,
            "lat_range": (35.130, 35.155),
            "lon_range": (33.338, 33.362),
            "weight": 0.35,
        },
        "Lakatamia": {
            "base_sqm": 1600,
            "sea_pct": 0.00,
            "lat_range": (35.120, 35.140),
            "lon_range": (33.310, 33.335),
            "weight": 0.20,
        },
        "Nicosia Old Town": {
            "base_sqm": 1700,
            "sea_pct": 0.00,
            "lat_range": (35.170, 35.185),
            "lon_range": (33.360, 33.382),
            "weight": 0.15,
        },
    },
    "larnaka": {
        "Finikoudes": {
            "base_sqm": 2000,
            "sea_pct": 0.70,
            "lat_range": (34.916, 34.930),
            "lon_range": (33.630, 33.650),
            "weight": 0.40,
        },
        "Drosia": {
            "base_sqm": 1700,
            "sea_pct": 0.20,
            "lat_range": (34.920, 34.935),
            "lon_range": (33.620, 33.640),
            "weight": 0.35,
        },
        "Aradippou": {
            "base_sqm": 1400,
            "sea_pct": 0.05,
            "lat_range": (34.940, 34.955),
            "lon_range": (33.580, 33.610),
            "weight": 0.25,
        },
    },
    "pafos": {
        "Kato Paphos": {
            "base_sqm": 2300,
            "sea_pct": 0.65,
            "lat_range": (34.754, 34.770),
            "lon_range": (32.408, 32.430),
            "weight": 0.50,
        },
        "Chloraka": {
            "base_sqm": 1900,
            "sea_pct": 0.35,
            "lat_range": (34.778, 34.795),
            "lon_range": (32.400, 32.425),
            "weight": 0.30,
        },
        "Yeroskipou": {
            "base_sqm": 1600,
            "sea_pct": 0.15,
            "lat_range": (34.756, 34.770),
            "lon_range": (32.440, 32.465),
            "weight": 0.20,
        },
    },
}

# District weights
DISTRICT_WEIGHTS = {
    "lemesos": 0.55,
    "lefkosia": 0.25,
    "larnaka": 0.12,
    "pafos": 0.08,
}

PROPERTY_TYPES = {
    "apartment": 0.55,
    "house": 0.25,
    "villa": 0.15,
    "land": 0.05,
}

# City center coordinates
CITY_CENTERS = {
    "lemesos": (34.6823, 33.0464),
    "lefkosia": (35.1856, 33.3823),
    "larnaka": (34.9229, 33.6233),
    "pafos": (34.7755, 32.4241),
    "ammochostos": (35.1167, 33.9500),
}

# Sea/coast reference points (simplified)
COAST_REFERENCE = {
    "lemesos": (34.6600, 33.0400),
    "larnaka": (34.9100, 33.6400),
    "pafos": (34.7550, 32.4100),
    "lefkosia": None,  # inland
    "ammochostos": (35.1100, 33.9600),
}


def haversine_km(lat1, lon1, lat2, lon2):
    """Haversine distance in km."""
    R = 6371
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2
    return R * 2 * np.arcsin(np.sqrt(a))


def generate_property(district: str, municipality: str, muni_data: dict) -> dict:
    """Generate a single realistic property."""

    prop_type = random.choices(
        list(PROPERTY_TYPES.keys()), weights=list(PROPERTY_TYPES.values())
    )[0]

    # Coordinates
    lat = random.uniform(*muni_data["lat_range"])
    lon = random.uniform(*muni_data["lon_range"])

    # Distance to sea
    coast = COAST_REFERENCE.get(district)
    if coast:
        dist_sea = haversine_km(lat, lon, coast[0], coast[1])
        dist_sea = max(0.05, dist_sea + random.gauss(0, 0.2))
    else:
        dist_sea = 50.0 + random.uniform(0, 20)  # Inland — far from sea

    # Distance to city center
    center = CITY_CENTERS[district]
    dist_center = haversine_km(lat, lon, center[0], center[1])

    # Area by property type
    if prop_type == "apartment":
        area_sqm = int(random.choice([
            random.randint(45, 65),
            random.randint(65, 90),
            random.randint(90, 130),
            random.randint(130, 200),
        ]))
        bedrooms = random.choices([1, 2, 3, 4], weights=[0.15, 0.45, 0.30, 0.10])[0]
        bathrooms = max(1, min(bedrooms, random.randint(1, 2)))
        floor = random.randint(1, 8)
        total_floors = floor + random.randint(0, 3)
        has_garden = False
        has_pool_raw = random.random() < 0.15
    elif prop_type == "house":
        area_sqm = int(random.choice([
            random.randint(90, 140),
            random.randint(140, 200),
            random.randint(200, 300),
        ]))
        bedrooms = random.choices([3, 4, 5], weights=[0.40, 0.40, 0.20])[0]
        bathrooms = random.randint(2, 3)
        floor = 0
        total_floors = random.choices([1, 2], weights=[0.40, 0.60])[0]
        has_garden = random.random() < 0.65
        has_pool_raw = random.random() < 0.25
    elif prop_type == "villa":
        area_sqm = int(random.choice([
            random.randint(180, 280),
            random.randint(280, 450),
            random.randint(450, 700),
        ]))
        bedrooms = random.choices([3, 4, 5, 6], weights=[0.20, 0.35, 0.30, 0.15])[0]
        bathrooms = random.randint(2, 4)
        floor = 0
        total_floors = random.choices([1, 2], weights=[0.25, 0.75])[0]
        has_garden = random.random() < 0.90
        has_pool_raw = random.random() < 0.70
    else:  # land
        area_sqm = int(random.choice([
            random.randint(300, 600),
            random.randint(600, 1500),
            random.randint(1500, 4000),
        ]))
        bedrooms = 0
        bathrooms = 0
        floor = 0
        total_floors = 0
        has_garden = False
        has_pool_raw = False

    # Year built
    year_built = None
    if prop_type != "land":
        year_built = random.choices(
            range(1970, 2026),
            weights=[
                # Older buildings less likely to be sold, newer more
                0.005 if y < 1985 else
                0.010 if y < 1995 else
                0.015 if y < 2005 else
                0.030 if y < 2015 else
                0.045
                for y in range(1970, 2026)
            ]
        )[0]

    property_age = (2025 - year_built) if year_built else 20

    # Determine sea view
    sea_view_prob = muni_data["sea_pct"]
    # Sea view more likely if < 1km from coast
    if dist_sea < 0.5:
        sea_view_prob = min(0.95, sea_view_prob * 1.8)
    elif dist_sea > 3.0:
        sea_view_prob = sea_view_prob * 0.2
    has_sea_view = random.random() < sea_view_prob

    has_parking = random.random() < (0.80 if prop_type != "land" else 0.30)
    has_pool = has_pool_raw
    has_title_deed = random.random() < 0.72  # 28% without title in Cyprus
    listing_type = random.choices(["resale", "new_build"], weights=[0.78, 0.22])[0]
    is_tourist_area = municipality in ["Kato Paphos", "Mouttagiaka", "Pyrgos", "Agios Tychonas"]

    # =====================
    # PRICE CALCULATION
    # =====================
    if prop_type == "land":
        base_price_sqm = muni_data["base_sqm"] * 0.4 * random.gauss(1.0, 0.15)
    else:
        base_price_sqm = muni_data["base_sqm"] * random.gauss(1.0, 0.10)

    # Multipliers
    mul = 1.0

    # Sea view premium
    if has_sea_view:
        mul += random.uniform(0.15, 0.28)
    # Sea proximity premium (even without sea view)
    elif dist_sea < 1.0:
        mul += random.uniform(0.05, 0.12)

    # Title deed premium/discount
    if not has_title_deed:
        mul -= random.uniform(0.12, 0.22)

    # Age depreciation
    if property_age:
        mul -= property_age * random.uniform(0.004, 0.008)
        mul = max(mul, 0.55)

    # Pool premium
    if has_pool:
        mul += random.uniform(0.06, 0.14)

    # Garden premium
    if has_garden:
        mul += random.uniform(0.03, 0.08)

    # New build premium
    if listing_type == "new_build":
        mul += random.uniform(0.10, 0.20)

    # High floor premium (apartments)
    if prop_type == "apartment" and floor and floor >= 5:
        mul += random.uniform(0.03, 0.07)
    elif prop_type == "apartment" and floor and floor == 1:
        mul -= random.uniform(0.02, 0.05)

    # Distance from center (closer = more expensive, but not always)
    if dist_center < 2.0:
        mul += random.uniform(0.02, 0.05)
    elif dist_center > 10.0:
        mul -= random.uniform(0.05, 0.10)

    # Parking
    if has_parking:
        mul += random.uniform(0.02, 0.05)

    # Villa/luxury premium
    if prop_type == "villa":
        mul += random.uniform(0.10, 0.20)

    price_per_sqm = max(500, base_price_sqm * mul)
    price = int(price_per_sqm * area_sqm)

    # Add noise (±8% — market variability)
    price = int(price * random.gauss(1.0, 0.08))

    # Round to nearest 1000
    price = max(30_000, round(price / 1000) * 1000)
    price = min(5_000_000, price)

    # Sale date (last 2 years)
    days_ago = random.randint(7, 730)
    sale_date = (datetime.now() - timedelta(days=days_ago)).date()

    return {
        "source": "synthetic",
        "is_actual_sale": True,
        "listing_type": listing_type,
        "price": price,
        "area_sqm": area_sqm,
        "property_type": prop_type,
        "bedrooms": bedrooms if prop_type != "land" else None,
        "bathrooms": bathrooms if prop_type != "land" else None,
        "floor": floor if prop_type == "apartment" else None,
        "total_floors": total_floors if prop_type != "land" else None,
        "year_built": year_built,
        "district": district,
        "municipality": municipality,
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "distance_to_sea_km": round(dist_sea, 3),
        "distance_to_center_km": round(dist_center, 3),
        "has_parking": has_parking,
        "has_sea_view": has_sea_view,
        "has_pool": has_pool,
        "has_garden": has_garden,
        "has_title_deed": has_title_deed,
        "is_tourist_area": is_tourist_area,
        "sale_date": sale_date.isoformat(),
        "property_age": property_age,
    }


def compute_area_medians(df: pd.DataFrame) -> pd.DataFrame:
    """Add area_median_price_sqm feature."""
    df["price_per_sqm"] = df["price"] / df["area_sqm"]
    meds = df.groupby("municipality")["price_per_sqm"].transform("median")
    df["area_median_price_sqm"] = meds.round(0).astype(int)
    return df


def generate_dataset(n: int = 2200) -> pd.DataFrame:
    records = []

    for _ in range(n):
        district = random.choices(
            list(DISTRICT_WEIGHTS.keys()),
            weights=list(DISTRICT_WEIGHTS.values())
        )[0]

        munis = MUNICIPALITIES[district]
        muni_names = list(munis.keys())
        muni_weights = [munis[m]["weight"] for m in muni_names]
        # normalize weights
        total = sum(muni_weights)
        muni_weights = [w / total for w in muni_weights]

        municipality = random.choices(muni_names, weights=muni_weights)[0]
        muni_data = munis[municipality]

        prop = generate_property(district, municipality, muni_data)
        records.append(prop)

    df = pd.DataFrame(records)
    df = compute_area_medians(df)

    print(f"✓ Generated {len(df)} properties")
    print(f"\nDistrict distribution:")
    print(df["district"].value_counts())
    print(f"\nProperty type distribution:")
    print(df["property_type"].value_counts())
    print(f"\nPrice statistics:")
    print(df["price"].describe().apply(lambda x: f"€{x:,.0f}"))
    print(f"\nPrice/sqm statistics:")
    print(df["price_per_sqm"].describe().apply(lambda x: f"€{x:.0f}"))

    return df


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    df = generate_dataset(2200)
    df.to_csv("data/synthetic_properties.csv", index=False)
    print(f"\n✓ Dataset saved to data/synthetic_properties.csv")
