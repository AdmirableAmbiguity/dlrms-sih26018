from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user, require_admin
from app.models.user import User
from app.models.fraud_flag import FraudFlag, Severity, FlagType
from app.schemas.fraud import FraudFlagOut
from app.services.blockchain.fraud_detector import run_fraud_analysis

router = APIRouter(prefix="/fraud", tags=["fraud"])

@router.get("/flags", response_model=List[FraudFlagOut])
async def list_fraud_flags(
    severity: Optional[Severity] = None,
    flag_type: Optional[FlagType] = None,
    is_resolved: Optional[bool] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    q = select(FraudFlag)
    if severity:
        q = q.where(FraudFlag.severity == severity)
    if flag_type:
        q = q.where(FraudFlag.flag_type == flag_type)
    if is_resolved is not None:
        q = q.where(FraudFlag.is_resolved == is_resolved)
        
    res = await db.execute(q)
    return res.scalars().all()

@router.get("/flags/{id}", response_model=FraudFlagOut)
async def get_fraud_flag(
    id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    flag = await db.get(FraudFlag, id)
    if not flag:
        raise HTTPException(404, "Flag not found")
    return flag

@router.post("/flags/{id}/resolve")
async def resolve_flag(
    id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    flag = await db.get(FraudFlag, id)
    if not flag:
        raise HTTPException(404, "Flag not found")
        
    flag.is_resolved = True
    flag.resolved_by = current_user.id
    flag.resolved_at = datetime.now()
    
    await db.commit()
    return {"message": "Flag resolved"}

@router.post("/analyze/{record_id}")
async def analyze_record(
    record_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    flags = await run_fraud_analysis(record_id, db)
    return {"message": f"Analysis complete. Found {len(flags)} flags."}
