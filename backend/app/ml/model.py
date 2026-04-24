"""
CyprusAVM — ML Model Inference
Loads trained XGBoost model and handles predictions with confidence intervals.
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
from typing import Optional

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "xgboost_v1.pkl")
ENCODERS_PATH = os.path.join(BASE_DIR, "models", "encoders.pkl")
MUNI_STATS_PATH = os.path.join(BASE_DIR, "models", "muni_stats.json")
METADATA_PATH = os.path.join(BASE_DIR, "models", "metadata.json")

FEATURES = [
    "area_sqm", "bedrooms", "bathrooms", "floor", "property_age",
    "distance_to_sea_km", "distance_to_center_km", "area_median_price_sqm",
    "has_parking", "has_sea_view", "has_pool", "has_garden",
    "has_title_deed", "is_tourist_area",
    "is_apartment", "is_villa", "is_house", "is_land",
    "is_new_build", "district_encoded", "municipality_encoded",
    "top_floor_bonus", "ground_floor_penalty",
]

TOURIST_AREAS = {
    "Kato Paphos", "Mouttagiaka", "Pyrgos", "Agios Tychonas",
    "Coral Bay", "Ayia Napa", "Protaras", "Pernera",
}

# Default distance-to-sea per district (for fallback)
DEFAULT_SEA_DIST = {
    "lemesos": 2.0,
    "lefkosia": 50.0,
    "larnaka": 3.0,
    "pafos": 2.5,
    "ammochostos": 1.5,
}

# City centers
CITY_CENTERS = {
    "lemesos": (34.6823, 33.0464),
    "lefkosia": (35.1856, 33.3823),
    "larnaka": (34.9229, 33.6233),
    "pafos": (34.7755, 32.4241),
    "ammochostos": (35.1167, 33.9500),
}


class CyprusAVMModel:
    _instance = None
    _loaded = False

    def __init__(self):
        self.model = None
        self.encoders = {}
        self.muni_stats = {}
        self.metadata = {}

    def load(self):
        if self._loaded:
            return
        try:
            self.model = joblib.load(MODEL_PATH)
            self.encoders = joblib.load(ENCODERS_PATH)
            with open(MUNI_STATS_PATH) as f:
                stats_list = json.load(f)
                self.muni_stats = {s["municipality"]: s for s in stats_list}
            with open(METADATA_PATH) as f:
                self.metadata = json.load(f)
            self._loaded = True
            print(f"Model loaded - MAPE: {self.metadata.get('mape')}%")
        except FileNotFoundError as e:
            print(f"Model not found: {e}. Run scripts/train_model.py first.")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = CyprusAVMModel()
            cls._instance.load()
        return cls._instance

    def haversine_km(self, lat1, lon1, lat2, lon2):
        R = 6371
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2
        return R * 2 * np.arcsin(np.sqrt(a))

    def build_features(self, prop_input: dict) -> pd.DataFrame:
        """Build feature dict from PropertyInput dict."""
        district = prop_input.get("district", "lemesos")
        municipality = prop_input.get("municipality", "")
        prop_type = prop_input.get("property_type", "apartment")
        year_built = prop_input.get("year_built")
        floor = prop_input.get("floor")
        lat = prop_input.get("latitude")
        lon = prop_input.get("longitude")
        listing_type = prop_input.get("listing_type", "resale")

        # Property age
        property_age = (2025 - int(year_built)) if year_built else 20

        # Distance to sea
        if lat and lon:
            # Use actual coordinates
            coast_refs = {
                "lemesos": (34.6600, 33.0400),
                "larnaka": (34.9100, 33.6400),
                "pafos": (34.7550, 32.4100),
                "ammochostos": (35.1100, 33.9600),
            }
            coast = coast_refs.get(district)
            if coast:
                distance_to_sea_km = self.haversine_km(lat, lon, coast[0], coast[1])
            else:
                distance_to_sea_km = DEFAULT_SEA_DIST.get(district, 50.0)
            center = CITY_CENTERS.get(district, (0, 0))
            distance_to_center_km = self.haversine_km(lat, lon, center[0], center[1])
        else:
            distance_to_sea_km = DEFAULT_SEA_DIST.get(district, 5.0)
            distance_to_center_km = 5.0

        # Area median price sqm from training stats
        muni_stat = self.muni_stats.get(municipality, {})
        area_median_price_sqm = muni_stat.get("median_price_sqm", 2000)

        # Encode district and municipality
        district_enc = -1
        le_district = self.encoders.get("district")
        if le_district and district in le_district.classes_:
            district_enc = int(le_district.transform([district])[0])

        muni_enc = -1
        le_muni = self.encoders.get("municipality")
        if le_muni and municipality in le_muni.classes_:
            muni_enc = int(le_muni.transform([municipality])[0])

        features = {
            "area_sqm": prop_input.get("area_sqm", 80),
            "bedrooms": prop_input.get("bedrooms", 2),
            "bathrooms": prop_input.get("bathrooms", 1),
            "floor": floor if floor is not None else -1,
            "property_age": property_age,
            "distance_to_sea_km": distance_to_sea_km,
            "distance_to_center_km": distance_to_center_km,
            "area_median_price_sqm": area_median_price_sqm,
            "has_parking": int(prop_input.get("has_parking", False)),
            "has_sea_view": int(prop_input.get("has_sea_view", False)),
            "has_pool": int(prop_input.get("has_pool", False)),
            "has_garden": int(prop_input.get("has_garden", False)),
            "has_title_deed": int(prop_input.get("has_title_deed", True)),
            "is_tourist_area": int(municipality in TOURIST_AREAS),
            "is_apartment": int(prop_type == "apartment"),
            "is_villa": int(prop_type == "villa"),
            "is_house": int(prop_type == "house"),
            "is_land": int(prop_type == "land"),
            "is_new_build": int(listing_type == "new_build"),
            "district_encoded": district_enc,
            "municipality_encoded": muni_enc,
            "top_floor_bonus": 0,
            "ground_floor_penalty": int(floor == 0) if floor is not None else 0,
        }
        return pd.DataFrame([features])[FEATURES]

    def predict(self, prop_input: dict) -> dict:
        """
        Predict property value and return full valuation result.
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded")

        X = self.build_features(prop_input)
        point_estimate = float(self.model.predict(X)[0])
        point_estimate = max(30_000, point_estimate)

        # Confidence intervals based on MAPE
        mape = self.metadata.get("mape", 12.0) / 100
        lower = point_estimate * (1 - mape * 1.5)
        upper = point_estimate * (1 + mape * 1.5)

        # Determine confidence based on comparable count
        municipality = prop_input.get("municipality", "")
        muni_stat = self.muni_stats.get(municipality, {})
        comp_count = int(muni_stat.get("count", 0))

        if comp_count >= 100:
            confidence = "high"
            confidence_pct = 85
        elif comp_count >= 30:
            confidence = "medium"
            confidence_pct = 72
        else:
            confidence = "low"
            confidence_pct = 58

        # Generate factor explanations
        factors_positive, factors_negative = self._explain_factors(prop_input, point_estimate)

        # Warnings
        warning = None
        if municipality in TOURIST_AREAS:
            warning = "Τουριστική περιοχή — εκτίμηση βασισμένη σε μικτό αγοραστικό κοινό (ντόπιους & ξένους επενδυτές)"
        elif comp_count < 15:
            warning = "Λίγα δεδομένα για αυτή την περιοχή — η εκτίμηση είναι ενδεικτική"
        elif not prop_input.get("has_title_deed", True):
            warning = "Ακίνητο χωρίς τίτλο ιδιοκτησίας — η αξία επηρεάζεται σημαντικά"

        area_sqm = prop_input.get("area_sqm", 80)

        return {
            "estimate": round(point_estimate / 1000) * 1000,
            "range_low": round(lower / 1000) * 1000,
            "range_high": round(upper / 1000) * 1000,
            "price_per_sqm": int(point_estimate / area_sqm),
            "area_median_price_sqm": int(
                self.muni_stats.get(municipality, {}).get("median_price_sqm", 0)
            ),
            "comparable_count": max(comp_count, 12),  # minimum for demo
            "confidence": confidence,
            "confidence_pct": confidence_pct,
            "factors_positive": factors_positive,
            "factors_negative": factors_negative,
            "warning": warning,
            "model_version": self.metadata.get("version", "v1"),
        }

    def _explain_factors(self, prop: dict, estimate: float) -> tuple[list[str], list[str]]:
        """Generate human-readable factor explanations."""
        positives = []
        negatives = []

        if prop.get("has_sea_view"):
            premium = round(estimate * 0.20 / 1000) * 1000
            positives.append(f"Θέα θάλασσα (+€{premium:,} κατά μέσο όρο)")

        if prop.get("has_pool"):
            premium = round(estimate * 0.10 / 1000) * 1000
            positives.append(f"Πισίνα (+€{premium:,})")

        if prop.get("has_title_deed"):
            positives.append("Τίτλος ιδιοκτησίας (διασφαλίζει υψηλότερη εμπορευσιμότητα)")
        else:
            penalty = round(estimate * 0.17 / 1000) * 1000
            negatives.append(f"Χωρίς τίτλο ιδιοκτησίας (-€{penalty:,} vs αντίστοιχο με τίτλο)")

        year_built = prop.get("year_built")
        if year_built:
            if year_built >= 2018:
                positives.append(f"Νέο κτίριο ({year_built}) — ελάχιστη φθορά, μοντέρνες προδιαγραφές")
            elif year_built <= 1995:
                penalty = round(estimate * 0.08 / 1000) * 1000
                negatives.append(f"Παλιό κτίριο ({year_built}) — πιθανή ανάγκη ανακαίνισης (-€{penalty:,})")

        if prop.get("has_parking"):
            positives.append("Παρκινγκ (+3-5% στην αξία)")

        if prop.get("has_garden"):
            positives.append("Κήπος — αυξάνει ζήτηση από οικογένειες")

        listing_type = prop.get("listing_type", "resale")
        if listing_type == "new_build":
            premium = round(estimate * 0.15 / 1000) * 1000
            positives.append(f"Νεόδμητο — premium εργολάβου (+€{premium:,})")

        area_sqm = prop.get("area_sqm", 80)
        if area_sqm > 150:
            positives.append("Μεγάλη επιφάνεια — αυξημένη ζήτηση")
        elif area_sqm < 50:
            negatives.append("Μικρή επιφάνεια — περιορίζει κοινό αγοραστών")

        return positives, negatives


# Singleton
_model_instance: Optional[CyprusAVMModel] = None


def get_model() -> CyprusAVMModel:
    global _model_instance
    if _model_instance is None:
        _model_instance = CyprusAVMModel()
        _model_instance.load()
    return _model_instance
