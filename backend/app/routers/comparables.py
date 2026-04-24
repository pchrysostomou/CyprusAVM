from fastapi import APIRouter, Query
from app.models.schemas import ComparableProperty
import pandas as pd
import os
import random

router = APIRouter()

# Load synthetic dataset for comparables
_data: pd.DataFrame = None


def get_data() -> pd.DataFrame:
    global _data
    if _data is None:
        data_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data", "synthetic_properties.csv"
        )
        if os.path.exists(data_path):
            _data = pd.read_csv(data_path)
        else:
            _data = pd.DataFrame()
    return _data


@router.get("/comparables", response_model=list[ComparableProperty])
async def get_comparables(
    district: str,
    property_type: str,
    area_sqm: int = Query(..., ge=20, le=1000),
    municipality: str = "",
    limit: int = Query(8, ge=1, le=20),
):
    """
    Returns comparable properties from the dataset.
    Filters by district, property type, and area (±35%).
    """
    df = get_data()

    if df.empty:
        return []

    # Filter
    mask = (
        (df["district"] == district) &
        (df["property_type"] == property_type) &
        (df["area_sqm"] >= area_sqm * 0.65) &
        (df["area_sqm"] <= area_sqm * 1.35) &
        (df["is_actual_sale"] == True)
    )

    if municipality:
        muni_mask = df["municipality"] == municipality
        filtered = df[mask & muni_mask]
        if len(filtered) < 3:
            # Fallback to district-level
            filtered = df[mask]
    else:
        filtered = df[mask]

    if filtered.empty:
        return []

    # Sort by sale_date desc, take top N
    if "sale_date" in filtered.columns:
        filtered = filtered.sort_values("sale_date", ascending=False)

    filtered = filtered.head(limit * 3)  # take more then sample

    # Similarity score (1.0 = perfect match on sqm)
    results = []
    for _, row in filtered.iterrows():
        sqm_diff = abs(row["area_sqm"] - area_sqm) / area_sqm
        similarity = max(0, 1.0 - sqm_diff * 2)

        results.append(ComparableProperty(
            id=int(row.get("id", random.randint(1000, 9999))),
            price=int(row["price"]),
            area_sqm=int(row["area_sqm"]),
            price_per_sqm=round(row["price"] / row["area_sqm"], 0),
            bedrooms=int(row["bedrooms"]) if pd.notna(row.get("bedrooms")) else None,
            municipality=str(row.get("municipality", district)),
            property_type=str(row["property_type"]),
            year_built=int(row["year_built"]) if pd.notna(row.get("year_built")) else None,
            has_sea_view=bool(row.get("has_sea_view", False)),
            has_parking=bool(row.get("has_parking", False)),
            sale_date=str(row["sale_date"]) if pd.notna(row.get("sale_date")) else None,
            similarity_score=round(similarity, 2),
        ))

    # Sort by similarity and take top N
    results.sort(key=lambda x: x.similarity_score, reverse=True)
    return results[:limit]
