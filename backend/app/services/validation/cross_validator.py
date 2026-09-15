from typing import NamedTuple, List, Optional
from rapidfuzz import fuzz
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.land_record import LandRecord
from app.services.connectors.dilrmp_mock import get_govt_record

class CrossValidationResult(NamedTuple):
    status: str
    govt_match: bool
    conflicts: List[str]
    discrepancies: List[str]

async def run_cross_validation(land_record: LandRecord, db: AsyncSession) -> CrossValidationResult:
    conflicts = []
    discrepancies = []
    
    # 1. Check existing LandRecords for duplicates
    existing_q = select(LandRecord).where(
        LandRecord.survey_number == land_record.survey_number,
        LandRecord.khasra_number == land_record.khasra_number,
        LandRecord.id != land_record.id
    )
    res = await db.execute(existing_q)
    existing_records = res.scalars().all()
    
    if existing_records:
        for ex in existing_records:
            if ex.owner_name.lower() != land_record.owner_name.lower():
                conflicts.append(f"Conflict: Existing record {ex.id} for Survey {land_record.survey_number} has different owner: {ex.owner_name}")
            else:
                discrepancies.append(f"Warning: Duplicate record found for Survey {land_record.survey_number} (Record ID: {ex.id})")
                
    # 2. Check against DILRMP mock
    govt_record = await get_govt_record(land_record.survey_number, land_record.khasra_number, db)
    govt_match = False
    
    if govt_record:
        govt_match = True
        # Fuzzy match owner name
        similarity = fuzz.ratio(land_record.owner_name.lower(), govt_record.owner_name.lower())
        if similarity < 80:
            conflicts.append(f"DILRMP Conflict: Owner name '{land_record.owner_name}' does not match govt records '{govt_record.owner_name}' (sim: {similarity})")
            
        # Area tolerance 5%
        area_diff = abs(land_record.plot_area_sqm - govt_record.plot_area_sqm)
        if area_diff > (govt_record.plot_area_sqm * 0.05):
            conflicts.append(f"DILRMP Conflict: Plot area {land_record.plot_area_sqm} differs by more than 5% from govt record {govt_record.plot_area_sqm}")
    else:
        discrepancies.append("Warning: Could not find matching record in DILRMP database.")
        
    status = "conflict" if conflicts else ("validated" if govt_match and not discrepancies else "needs_review")
    return CrossValidationResult(status=status, govt_match=govt_match, conflicts=conflicts, discrepancies=discrepancies)
