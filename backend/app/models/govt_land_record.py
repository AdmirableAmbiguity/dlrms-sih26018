from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base

class GovtLandRecord(Base):
    __tablename__ = "govt_land_records"

    id = Column(Integer, primary_key=True, index=True)
    source_system = Column(String, default="DILRMP")
    external_id = Column(String, unique=True, index=True, nullable=False)
    owner_name = Column(String, nullable=False)
    survey_number = Column(String, nullable=False, index=True)
    khasra_number = Column(String, nullable=False, index=True)
    plot_area_sqm = Column(Float, nullable=False)
    village = Column(String, nullable=False)
    tehsil = Column(String, nullable=False)
    district = Column(String, nullable=False)
    registration_number = Column(String, nullable=True)
    registration_date = Column(DateTime(timezone=True), nullable=True)
    raw_data = Column(JSONB, nullable=True)
