from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.land_record import LandClassification, OwnershipType, ValidationStatus

class LandRecordCreate(BaseModel):
    document_id: int
    canonical_id: str
    owner_name: str
    survey_number: str
    khasra_number: str
    khata_number: Optional[str] = None
    plot_area_sqm: float
    village: str
    tehsil: str
    district: str
    state: str = "Uttar Pradesh"
    land_classification: Optional[LandClassification] = None
    ownership_type: Optional[OwnershipType] = None
    registration_number: Optional[str] = None
    registration_date: Optional[datetime] = None
    mutation_number: Optional[str] = None
    mutation_date: Optional[datetime] = None

class LandRecordUpdate(BaseModel):
    owner_name: Optional[str] = None
    plot_area_sqm: Optional[float] = None
    validation_status: Optional[ValidationStatus] = None

class LandRecordOut(LandRecordCreate):
    id: int
    validation_status: ValidationStatus
    blockchain_tx_hash: Optional[str] = None
    is_blockchain_locked: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ValidationStatusOut(BaseModel):
    status: ValidationStatus
    message: str
    conflicts: Optional[List[str]] = None
