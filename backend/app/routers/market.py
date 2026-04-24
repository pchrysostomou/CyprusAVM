from fastapi import APIRouter, HTTPException
from app.models.schemas import MarketStatsResponse
import pandas as pd
import os
from datetime import datetime, timedelta

router = APIRouter()

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


@router.get("/market-stats/{district}", response_model=MarketStatsResponse)
async def market_stats(district: str):
    """Market statistics for a district."""
    df = get_data()

    if df.empty:
        raise HTTPException(status_code=503, detail="Data not available")

    valid_districts = ["lemesos", "lefkosia", "larnaka", "pafos", "ammochostos"]
    if district not in valid_districts:
        raise HTTPException(status_code=404, detail=f"District '{district}' not found")

    district_df = df[df["district"] == district].copy()
    district_df = district_df[district_df["property_type"] != "land"]

    if district_df.empty:
        raise HTTPException(status_code=404, detail="No data for this district")

    district_df["price_per_sqm"] = district_df["price"] / district_df["area_sqm"]

    # Overall stats
    median_price_sqm = int(district_df["price_per_sqm"].median())
    avg_price_sqm = int(district_df["price_per_sqm"].mean())
    transaction_count = len(district_df)

    # YoY change (compare last 12 months vs previous 12 months synthetic approximation)
    price_change_pct = round(
        (district_df["price_per_sqm"].tail(len(district_df) // 2).mean() /
         district_df["price_per_sqm"].head(len(district_df) // 2).mean() - 1) * 100,
        1
    )

    # Breakdown by property type
    breakdown = {}
    for pt in ["apartment", "house", "villa"]:
        pt_df = district_df[district_df["property_type"] == pt]
        if not pt_df.empty:
            breakdown[pt] = {
                "median_price_sqm": int(pt_df["price_per_sqm"].median()),
                "count": len(pt_df),
                "avg_price": int(pt_df["price"].mean()),
            }

    # Municipality breakdown (top 5)
    muni_stats = (
        district_df.groupby("municipality")
        .agg(
            median_price_sqm=("price_per_sqm", "median"),
            count=("price", "count"),
            avg_price=("price", "mean"),
        )
        .reset_index()
        .sort_values("count", ascending=False)
        .head(6)
    )
    municipalities = [
        {
            "name": row["municipality"],
            "median_price_sqm": int(row["median_price_sqm"]),
            "count": int(row["count"]),
            "avg_price": int(row["avg_price"]),
        }
        for _, row in muni_stats.iterrows()
    ]

    # 12-month price trend (mock monthly data based on synthetic)
    price_trend_12m = []
    base_sqm = median_price_sqm
    for i in range(12, 0, -1):
        month_date = (datetime.now() - timedelta(days=30 * i))
        # Simulate gentle uptrend
        factor = 1 + (12 - i) * 0.004 + (hash(district + str(i)) % 100 - 50) / 5000
        price_trend_12m.append({
            "month": month_date.strftime("%b %Y"),
            "median_price_sqm": int(base_sqm * factor),
        })

    return MarketStatsResponse(
        district=district,
        period=datetime.now().strftime("%B %Y"),
        median_price_sqm=median_price_sqm,
        avg_price_sqm=avg_price_sqm,
        transaction_count=transaction_count,
        price_change_pct=price_change_pct,
        breakdown_by_type=breakdown,
        municipalities=municipalities,
        price_trend_12m=price_trend_12m,
    )
