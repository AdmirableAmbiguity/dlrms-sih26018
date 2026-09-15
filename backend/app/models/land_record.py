from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base
import enum

class LandClassification(str, enum.Enum):
    agricultural = "agricultural"
    residential = "residential"
    commercial = "commercial"
    industrial = "industrial"
    forest = "forest"
    wasteland = "wasteland"

class OwnershipType(str, enum.Enum):
    individual = "individual"
    joint = "joint"
    government = "government"
    trust = "trust"

class ValidationStatus(str, enum.Enum):
    validated = "validated"
    conflict = "conflict"
    needs_review = "needs_review"
    pending = "pending"

class LandRecord(Base):
    __tablename__ = "land_records"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    canonical_id = Column(String, unique=True, index=True, nullable=False) # unique slug
    owner_name = Column(String, nullable=False)
    survey_number = Column(String, nullable=False, index=True)
    khasra_number = Column(String, nullable=False, index=True)
    khata_number = Column(String, nullable=True)
    plot_area_sqm = Column(Float, nullable=False)
    village = Column(String, nullable=False)
    tehsil = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False, default="Uttar Pradesh")
    
    land_classification = Column(Enum(LandClassification), nullable=True)
    ownership_type = Column(Enum(OwnershipType), nullable=True)
    
    registration_number = Column(String, nullable=True)
    registration_date = Column(DateTime(timezone=True), nullable=True)
    mutation_number = Column(String, nullable=True)
    mutation_date = Column(DateTime(timezone=True), nullable=True)
    
    validation_status = Column(Enum(ValidationStatus), default=ValidationStatus.pending)
    blockchain_tx_hash = Column(String, nullable=True)
    is_blockchain_locked = Column(Boolean, default=False)
    
    geometry = Column(Geometry('POLYGON'), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    document = relationship("Document", backref="land_record")
