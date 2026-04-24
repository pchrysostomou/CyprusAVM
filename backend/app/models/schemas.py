from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class DistrictEnum(str, Enum):
    lemesos = "lemesos"
    lefkosia = "lefkosia"
    larnaka = "larnaka"
    pafos = "pafos"
    ammochostos = "ammochostos"


class PropertyTypeEnum(str, Enum):
    apartment = "apartment"
    house = "house"
    villa = "villa"
    land = "land"


class ListingTypeEnum(str, Enum):
    resale = "resale"
    new_build = "new_build"


class ConfidenceEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class PropertyInput(BaseModel):
    area_sqm: int = Field(..., ge=20, le=1000, description="Area in square meters")
    bedrooms: int = Field(..., ge=0, le=10)
    bathrooms: int = Field(1, ge=1, le=8)
    district: DistrictEnum
    municipality: str = Field(..., min_length=2, max_length=100)
    property_type: PropertyTypeEnum
    listing_type: ListingTypeEnum = ListingTypeEnum.resale
    year_built: Optional[int] = Field(None, ge=1950, le=2026)
    floor: Optional[int] = Field(None, ge=0, le=50)
    total_floors: Optional[int] = Field(None, ge=1, le=50)
    has_parking: bool = False
    has_sea_view: bool = False
    has_pool: bool = False
    has_garden: bool = False
    has_title_deed: bool = True
    latitude: Optional[float] = Field(None, ge=34.5, le=35.8)
    longitude: Optional[float] = Field(None, ge=32.2, le=34.7)

    model_config = {
        "json_schema_extra": {
            "example": {
                "area_sqm": 85,
                "bedrooms": 2,
                "bathrooms": 1,
                "district": "lemesos",
                "municipality": "Agía Zóni",
                "property_type": "apartment",
                "year_built": 2015,
                "floor": 3,
                "has_sea_view": True,
                "has_parking": True,
                "has_title_deed": True,
            }
        }
    }


class ValuationResult(BaseModel):
    estimate: int
    range_low: int
    range_high: int
    price_per_sqm: int
    area_median_price_sqm: int
    comparable_count: int
    confidence: ConfidenceEnum
    confidence_pct: int
    factors_positive: list[str]
    factors_negative: list[str]
    warning: Optional[str] = None
    model_version: str = "v1"


class ComparableProperty(BaseModel):
    id: int
    price: int
    area_sqm: int
    price_per_sqm: float
    bedrooms: Optional[int]
    municipality: str
    property_type: str
    year_built: Optional[int]
    has_sea_view: bool
    has_parking: bool
    sale_date: Optional[str]
    similarity_score: float


class MarketStatsResponse(BaseModel):
    district: str
    period: str
    median_price_sqm: int
    avg_price_sqm: int
    transaction_count: int
    price_change_pct: float
    breakdown_by_type: dict
    municipalities: list[dict]
    price_trend_12m: list[dict]
