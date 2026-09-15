from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class FlagType(str, enum.Enum):
    circular_resale = "circular_resale"
    price_inflation = "price_inflation"
    duplicate_owner = "duplicate_owner"
    forged_document = "forged_document"
    rccms_litigation = "rccms_litigation"

class Severity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class FraudFlag(Base):
    __tablename__ = "fraud_flags"

    id = Column(Integer, primary_key=True, index=True)
    land_record_id = Column(Integer, ForeignKey("land_records.id"))
    flag_type = Column(Enum(FlagType), nullable=False)
    severity = Column(Enum(Severity), nullable=False)
    description = Column(String, nullable=False)
    evidence_json = Column(JSONB, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    land_record = relationship("LandRecord", backref="fraud_flags")
    resolver = relationship("User", backref="resolved_flags")
