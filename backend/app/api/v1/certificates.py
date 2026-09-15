from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.land_record import LandRecord
from app.services.certificates.pdf_generator import generate_certificate_pdf
from app.services.certificates.verifier import verify_certificate as verify_service
from app.schemas.certificate import CertificateOut

router = APIRouter(prefix="/certificates", tags=["certificates"])

@router.post("/generate/{record_id}", response_model=CertificateOut)
async def generate_cert(
    record_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    lr = await db.get(LandRecord, record_id)
    if not lr:
        raise HTTPException(404, "Record not found")
        
    base_url = str(request.base_url).rstrip('/')
    # We will generate it on the fly for download
    return CertificateOut(
        download_url=f"{base_url}/api/v1/certificates/download/{lr.canonical_id}",
        record_hash=lr.canonical_id,
        message="Certificate generated"
    )

@router.get("/download/{canonical_id}")
async def download_cert(
    canonical_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    q = select(LandRecord).where(LandRecord.canonical_id == canonical_id)
    res = await db.execute(q)
    lr = res.scalars().first()
    
    if not lr:
        raise HTTPException(404, "Record not found")
        
    base_url = str(request.base_url).rstrip('/')
    pdf_bytes = generate_certificate_pdf(lr, base_url)
    
    return Response(content=pdf_bytes, media_type="application/pdf")

@router.get("/verify/{canonical_id}")
async def verify_cert(
    canonical_id: str,
    db: AsyncSession = Depends(get_db)
):
    res = await verify_service(canonical_id, db)
    return res
