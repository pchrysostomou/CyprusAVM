from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import Column, Integer, String, Boolean, Decimal, Date, DateTime, Text, SmallInteger
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/cyprusavm")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), default="synthetic")
    is_actual_sale = Column(Boolean, default=False)
    listing_type = Column(String(20), default="resale")

    price = Column(Integer, nullable=False)
    area_sqm = Column(Integer, nullable=False)
    property_type = Column(String(50))
    bedrooms = Column(SmallInteger)
    bathrooms = Column(SmallInteger)
    floor = Column(SmallInteger)
    year_built = Column(SmallInteger)
    total_floors = Column(SmallInteger)

    district = Column(String(50), index=True)
    municipality = Column(String(100), index=True)
    address = Column(Text)
    latitude = Column(Decimal(10, 7))
    longitude = Column(Decimal(10, 7))
    distance_to_sea_km = Column(Decimal(8, 3))
    distance_to_center_km = Column(Decimal(8, 3))

    has_parking = Column(Boolean, default=False)
    has_sea_view = Column(Boolean, default=False)
    has_pool = Column(Boolean, default=False)
    has_garden = Column(Boolean, default=False)
    has_title_deed = Column(Boolean, default=True)
    is_tourist_area = Column(Boolean, default=False)

    listed_date = Column(Date)
    sale_date = Column(Date)
    agent_id = Column(String(50))
    url = Column(Text, unique=True)
    created_at = Column(DateTime, server_default=func.now())


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)
