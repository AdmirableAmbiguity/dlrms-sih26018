from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import os
import aiofiles
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user, require_citizen
from app.models.user import User
from app.models.document import Document, UploadStatus
from app.schemas.document import DocumentUploadResponse, DocumentOut, DocumentListOut
from app.services.ocr.pipeline import run_ocr_pipeline

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Save file
    file_path = f"uploads/{datetime.now().timestamp()}_{file.filename}"
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        
    # Create DB entry
    doc = Document(
        filename=file.filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type,
        uploaded_by=current_user.id
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    
    # In a real app, send to Celery. For now, we await it directly
    # This will block but it's acceptable for the hackathon MVP
    res = await run_ocr_pipeline(doc.id, db)
    
    await db.refresh(doc)
    
    return DocumentUploadResponse(
        id=doc.id,
        filename=doc.filename,
        status=doc.upload_status,
        message=f"Pipeline result: {res.get('status')}"
    )

@router.get("/", response_model=DocumentListOut)
async def list_documents(
    status: Optional[UploadStatus] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    q = select(Document)
    if current_user.role == "citizen":
        q = q.where(Document.uploaded_by == current_user.id)
        
    if status:
        q = q.where(Document.upload_status == status)
        
    q = q.offset(skip).limit(limit)
    res = await db.execute(q)
    docs = res.scalars().all()
    
    return DocumentListOut(items=docs, total=len(docs))

@router.get("/{id}", response_model=DocumentOut)
async def get_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Document, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if current_user.role == "citizen" and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return doc

@router.get("/{id}/status")
async def get_document_status(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Document, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": doc.upload_status, "rejection_reason": doc.rejection_reason}
