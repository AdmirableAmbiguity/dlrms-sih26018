from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class CaseStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    disposed = "disposed"
    stayed = "stayed"

class CourtCase(Base):
    __tablename__ = "court_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True, nullable=False)
    court_name = Column(String, nullable=False)
    petitioner = Column(String, nullable=False)
    respondent = Column(String, nullable=False)
    survey_reference = Column(String, nullable=True, index=True)
    khasra_reference = Column(String, nullable=True, index=True)
    case_status = Column(Enum(CaseStatus), nullable=False)
    filing_date = Column(DateTime(timezone=True), nullable=False)
    next_hearing_date = Column(DateTime(timezone=True), nullable=True)
    is_simulated = Column(Boolean, default=True)
    
    # Source label: 'Simulated — RCCMS sandbox'
    source = Column(String, default="Simulated — RCCMS sandbox")
