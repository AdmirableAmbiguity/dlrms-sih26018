from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user, require_admin
from app.models.user import User
from app.models.land_record import LandRecord, ValidationStatus
from app.schemas.land_record import LandRecordOut, ValidationStatusOut
from app.services.validation.business_rules import run_business_rules
from app.services.validation.cross_validator import run_cross_validation
from app.services.rccms.fuzzy_matcher import match_against_rccms
from app.services.blockchain.chain_client import lock_record as chain_lock

router = APIRouter(prefix="/records", tags=["records"])

@router.get("/", response_model=List[LandRecordOut])
async def list_records(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Should implement filtering by owner for citizen
    q = select(LandRecord).offset(skip).limit(limit)
    res = await db.execute(q)
    return res.scalars().all()

@router.get("/{id}")
async def get_record(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    lr = await db.get(LandRecord, id)
    if not lr:
        raise HTTPException(404, "Record not found")
    return lr

@router.post("/{id}/validate", response_model=ValidationStatusOut)
async def validate_record(
    id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    lr = await db.get(LandRecord, id)
    if not lr:
        raise HTTPException(404, "Record not found")
        
    # 1. Business Rules
    br_res = run_business_rules({"plot_area_sqm": lr.plot_area_sqm, "district": lr.district, "tehsil": lr.tehsil, "owner_name": lr.owner_name})
    if not br_res.passed:
        lr.validation_status = ValidationStatus.conflict
        await db.commit()
        return ValidationStatusOut(status=lr.validation_status, message="Business rules failed", conflicts=br_res.errors)
        
    # 2. Cross Validation (DILRMP)
    cv_res = await run_cross_validation(lr, db)
    if cv_res.status == "conflict":
        lr.validation_status = ValidationStatus.conflict
        await db.commit()
        return ValidationStatusOut(status=lr.validation_status, message="Cross validation conflicts found", conflicts=cv_res.conflicts)
        
    # 3. RCCMS Check
    rccms_matches = await match_against_rccms(lr.owner_name, lr.survey_number, db)
    if rccms_matches:
        lr.validation_status = ValidationStatus.conflict
        await db.commit()
        return ValidationStatusOut(status=lr.validation_status, message="RCCMS Litigation risk found", conflicts=[m["case_number"] for m in rccms_matches])
        
    lr.validation_status = ValidationStatus.validated
    await db.commit()
    return ValidationStatusOut(status=lr.validation_status, message="Validation successful", conflicts=[])

@router.post("/{id}/blockchain-lock")
async def lock_blockchain(
    id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    lr = await db.get(LandRecord, id)
    if not lr:
        raise HTTPException(404)
        
    if lr.validation_status != ValidationStatus.validated:
        raise HTTPException(400, "Must validate before locking")
        
    tx_hash = await chain_lock(lr.id, lr.canonical_id, lr.owner_name)
    lr.blockchain_tx_hash = tx_hash
    lr.is_blockchain_locked = True
    await db.commit()
    
    return {"message": "Locked on blockchain", "tx_hash": tx_hash}

@router.get("/{id}/ownership-history")
async def ownership_history(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.blockchain.ownership_history import get_ownership_history
    history = await get_ownership_history(id, db)
    return history
