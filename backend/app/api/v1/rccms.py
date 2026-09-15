from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.rccms.rccms_mock import get_all_mock_cases
from app.services.rccms.fuzzy_matcher import match_against_rccms
from app.models.land_record import LandRecord

router = APIRouter(prefix="/rccms", tags=["rccms"])

@router.get("/cases")
async def get_cases(db: AsyncSession = Depends(get_db)):
    cases = await get_all_mock_cases(db)
    return cases

@router.get("/check/{record_id}")
async def check_rccms(
    record_id: int,
    db: AsyncSession = Depends(get_db)
):
    lr = await db.get(LandRecord, record_id)
    if not lr:
        raise HTTPException(404, "Record not found")
        
    matches = await match_against_rccms(lr.owner_name, lr.survey_number, db)
    return {"matches": matches, "source": "Simulated — RCCMS sandbox"}
