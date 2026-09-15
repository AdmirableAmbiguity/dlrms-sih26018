from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user, require_revenue_officer
from app.models.user import User
from app.models.document import Document, UploadStatus
from app.models.land_record import LandRecord, ValidationStatus
from app.models.ocr_feedback import OCRFeedback
from app.schemas.document import DocumentOut
from app.services.ocr.field_extractor import extract_fields

router = APIRouter(prefix="/review", tags=["review"])

@router.get("/queue", response_model=List[DocumentOut])
async def get_review_queue(
    current_user: User = Depends(require_revenue_officer),
    db: AsyncSession = Depends(get_db)
):
    q = select(Document).where(Document.upload_status == UploadStatus.needs_review)
    res = await db.execute(q)
    return res.scalars().all()

@router.get("/{doc_id}")
async def get_review_detail(
    doc_id: int,
    current_user: User = Depends(require_revenue_officer),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
        
    # Get associated land record if exists
    q = select(LandRecord).where(LandRecord.document_id == doc_id)
    res = await db.execute(q)
    lr = res.scalars().first()
    
    # re-extract to show what the engine saw
    extracted = {}
    if doc.ocr_raw_text:
        extracted = extract_fields(doc.ocr_raw_text).get("fields", {})
        
    return {
        "document": doc,
        "extracted_fields": extracted,
        "land_record": lr,
        "image_url": f"/static/{doc.file_path}"
    }

@router.patch("/{doc_id}/fields")
async def update_fields(
    doc_id: int,
    corrections: dict = Body(...),
    current_user: User = Depends(require_revenue_officer),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404)
        
    # Find LR
    q = select(LandRecord).where(LandRecord.document_id == doc_id)
    res = await db.execute(q)
    lr = res.scalars().first()
    
    if not lr:
        raise HTTPException(404, "Land Record mapping not found")
        
    for field, value in corrections.items():
        if hasattr(lr, field):
            orig_val = getattr(lr, field)
            setattr(lr, field, value)
            
            fb = OCRFeedback(
                document_id=doc_id,
                field_name=field,
                original_value=str(orig_val),
                corrected_value=str(value),
                corrected_by=current_user.id
            )
            db.add(fb)
            
    await db.commit()
    return {"message": "Fields updated and feedback recorded"}

@router.post("/{doc_id}/approve")
async def approve_document(
    doc_id: int,
    current_user: User = Depends(require_revenue_officer),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404)
    
    doc.upload_status = UploadStatus.auto_accepted
    await db.commit()
    return {"message": "Document approved"}

@router.post("/{doc_id}/reject")
async def reject_document(
    doc_id: int,
    reason: str = Body(..., embed=True),
    current_user: User = Depends(require_revenue_officer),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404)
    
    doc.upload_status = UploadStatus.rejected
    doc.rejection_reason = reason
    await db.commit()
    return {"message": "Document rejected"}
