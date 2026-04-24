"""
CyprusAVM — XGBoost Training Script
Trains the property valuation model on synthetic Cyprus data.
Target: MAPE < 12% on test set.
"""

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_percentage_error, mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import json
from datetime import datetime

FEATURES = [
    "area_sqm",
    "bedrooms",
    "bathrooms",
    "floor",
    "property_age",
    "distance_to_sea_km",
    "distance_to_center_km",
    "area_median_price_sqm",
    "has_parking",
    "has_sea_view",
    "has_pool",
    "has_garden",
    "has_title_deed",
    "is_tourist_area",
    "is_apartment",
    "is_villa",
    "is_house",
    "is_land",
    "is_new_build",
    "district_encoded",
    "municipality_encoded",
    "top_floor_bonus",
    "ground_floor_penalty",
]

ENCODERS = {}


def prepare_features(df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
    """Engineer features for training or inference."""
    df = df.copy()

    # Fill missing values
    df["bedrooms"] = df["bedrooms"].fillna(0).astype(float)
    df["bathrooms"] = df["bathrooms"].fillna(1).astype(float)
    df["floor"] = df["floor"].fillna(-1).astype(float)
    df["property_age"] = df.get("property_age", pd.Series(dtype=float))
    if "property_age" not in df.columns:
        df["property_age"] = df["year_built"].apply(
            lambda y: (2025 - int(y)) if pd.notna(y) else 20
        )
    df["property_age"] = df["property_age"].fillna(20).astype(float)
    df["distance_to_sea_km"] = df["distance_to_sea_km"].fillna(50.0).astype(float)
    df["distance_to_center_km"] = df["distance_to_center_km"].fillna(10.0).astype(float)
    df["area_median_price_sqm"] = df["area_median_price_sqm"].fillna(
        df["area_median_price_sqm"].median() if "area_median_price_sqm" in df.columns else 2000
    ).astype(float)

    # Boolean features
    for col in ["has_parking", "has_sea_view", "has_pool", "has_garden", "has_title_deed", "is_tourist_area"]:
        if col in df.columns:
            df[col] = df[col].fillna(False).astype(int)
        else:
            df[col] = 0

    # One-hot property type
    for pt in ["apartment", "villa", "house", "land"]:
        df[f"is_{pt}"] = (df["property_type"] == pt).astype(int)

    # Listing type
    df["is_new_build"] = (df.get("listing_type", "resale") == "new_build").astype(int)

    # Floor bonuses
    df["top_floor_bonus"] = (
        df["floor"].notna() &
        df.get("total_floors", df["floor"]).notna() &
        (df["floor"] >= df.get("total_floors", df["floor"]) - 1)
    ).astype(int)
    df["ground_floor_penalty"] = (df["floor"] == 0).astype(int)

    # Encode categoricals
    for col in ["district", "municipality"]:
        enc_col = f"{col}_encoded"
        if fit:
            le = LabelEncoder()
            df[enc_col] = le.fit_transform(df[col].fillna("unknown").astype(str))
            ENCODERS[col] = le
        else:
            le = ENCODERS.get(col)
            if le:
                known = set(le.classes_)
                df[enc_col] = df[col].fillna("unknown").astype(str).apply(
                    lambda x: le.transform([x])[0] if x in known else -1
                )
            else:
                df[enc_col] = -1

    return df


def train_model(data_path: str = "data/synthetic_properties.csv"):
    print("=" * 60)
    print("CyprusAVM — XGBoost Training")
    print("=" * 60)

    # Load data
    df = pd.read_csv(data_path)
    print(f"\n✓ Loaded {len(df)} properties from {data_path}")

    # Only use actual sales for training (not just listings)
    df = df[df["is_actual_sale"] == True].copy()

    # Remove land from main model (too sparse)
    df_main = df[df["property_type"] != "land"].copy()
    print(f"✓ Training samples (excl. land): {len(df_main)}")

    # Remove outliers
    df_main = df_main[(df_main["price"] >= 30_000) & (df_main["price"] <= 4_000_000)]
    price_sqm = df_main["price"] / df_main["area_sqm"]
    z_scores = (price_sqm - price_sqm.mean()) / price_sqm.std()
    df_main = df_main[z_scores.abs() < 3]
    print(f"✓ After outlier removal: {len(df_main)}")

    # Feature engineering
    df_main = prepare_features(df_main, fit=True)

    X = df_main[FEATURES]
    y = df_main["price"]

    # Train/test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"\n✓ Train: {len(X_train)} | Test: {len(X_test)}")

    # XGBoost model
    model = xgb.XGBRegressor(
        n_estimators=800,
        max_depth=6,
        learning_rate=0.03,
        subsample=0.80,
        colsample_bytree=0.80,
        min_child_weight=5,
        reg_alpha=0.1,
        reg_lambda=1.0,
        gamma=0.1,
        random_state=42,
        n_jobs=-1,
        early_stopping_rounds=50,
    )

    print("\nTraining XGBoost...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=100,
    )

    # Evaluation
    y_pred = model.predict(X_test)
    mape = mean_absolute_percentage_error(y_test, y_pred) * 100
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("\n" + "=" * 60)
    print("MODEL PERFORMANCE")
    print("=" * 60)
    print(f"  MAPE:  {mape:.2f}%   (target: < 12%)")
    print(f"  MAE:   €{mae:,.0f}")
    print(f"  R²:    {r2:.4f}")

    # Feature importance
    importance_df = pd.DataFrame({
        "feature": FEATURES,
        "importance": model.feature_importances_,
    }).sort_values("importance", ascending=False)
    print("\nTop 10 Features:")
    print(importance_df.head(10).to_string(index=False))

    # Compute per-district confidence intervals (±%)
    # Using 10th/90th percentile of relative errors per district
    residuals_pct = (y_pred - y_test.values) / y_test.values * 100
    p10 = np.percentile(residuals_pct, 10)
    p90 = np.percentile(residuals_pct, 90)
    print(f"\n  Prediction range: [{p10:.1f}%, +{p90:.1f}%] (10th-90th pct)")

    # Also compute per-municipality stats for the comparables
    muni_stats = df_main.groupby("municipality").agg(
        median_price_sqm=("price_per_sqm", "median"),
        count=("price", "count"),
    ).reset_index()

    # Save model artifacts
    os.makedirs("models", exist_ok=True)
    model_path = "models/xgboost_v1.pkl"
    encoders_path = "models/encoders.pkl"
    stats_path = "models/muni_stats.json"
    features_path = "models/features.json"

    joblib.dump(model, model_path)
    joblib.dump(ENCODERS, encoders_path)
    muni_stats.to_json(stats_path, orient="records")
    with open(features_path, "w") as f:
        json.dump({"features": FEATURES, "mape": mape, "mae": mae, "r2": r2}, f, indent=2)

    print(f"\n✓ Model saved → {model_path}")
    print(f"✓ Encoders saved → {encoders_path}")
    print(f"✓ Muni stats saved → {stats_path}")

    # Save metadata
    metadata = {
        "version": "v1",
        "trained_at": datetime.now().isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "mape": round(mape, 2),
        "mae": round(mae, 0),
        "r2": round(r2, 4),
        "features": FEATURES,
    }
    with open("models/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n✓ Training complete! MAPE = {mape:.2f}%")
    return model


if __name__ == "__main__":
    train_model()
