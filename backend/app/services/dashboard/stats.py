from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.models.document import Document, UploadStatus
from app.models.land_record import LandRecord, ValidationStatus
from app.models.fraud_flag import FraudFlag
from app.models.court_case import CourtCase, CaseStatus

async def get_dashboard_stats(db: AsyncSession) -> dict:
    # Basic counts
    doc_count = await db.execute(select(func.count(Document.id)))
    total_docs = doc_count.scalar() or 0
    
    # Status breakdown
    status_counts = await db.execute(
        select(Document.upload_status, func.count(Document.id))
        .group_by(Document.upload_status)
    )
    status_breakdown = {s.value: c for s, c in status_counts.all()}
    
    # Validation breakdown
    val_counts = await db.execute(
        select(LandRecord.validation_status, func.count(LandRecord.id))
        .group_by(LandRecord.validation_status)
    )
    validation_breakdown = {s.value: c for s, c in val_counts.all()}
    
    # OCR confidence avg
    avg_conf = await db.execute(select(func.avg(Document.ocr_confidence)))
    avg_ocr_confidence = avg_conf.scalar() or 0.0
    
    # Pending review
    pending_review = status_breakdown.get(UploadStatus.needs_review.value, 0)
    
    # Active fraud flags
    fraud_counts = await db.execute(
        select(FraudFlag.flag_type, func.count(FraudFlag.id))
        .where(FraudFlag.is_resolved == False)
        .group_by(FraudFlag.flag_type)
    )
    active_fraud_flags = {f.value: c for f, c in fraud_counts.all()}
    
    # Active litigation flags
    active_litigation = await db.execute(
        select(func.count(CourtCase.id))
        .where(CourtCase.case_status.in_([CaseStatus.pending, CaseStatus.active, CaseStatus.stayed]))
    )
    active_litigation_flags = active_litigation.scalar() or 0
    
    # District progress
    districts = await db.execute(
        select(
            LandRecord.district,
            func.count(LandRecord.id).label("total"),
            func.sum(case([(LandRecord.validation_status == ValidationStatus.validated, 1)], else_=0)).label("validated")
        ).group_by(LandRecord.district)
    )
    
    district_progress = []
    # Import case conditionally for the query above
    from sqlalchemy import case
    
    districts = await db.execute(
        select(
            LandRecord.district,
            func.count(LandRecord.id).label("total"),
            func.sum(case((LandRecord.validation_status == ValidationStatus.validated, 1), else_=0)).label("validated")
        ).group_by(LandRecord.district)
    )
    for row in districts.all():
        d_name, total, val_count = row
        district_progress.append({
            "district": d_name,
            "total_records": total,
            "validated_records": val_count,
            "pending_records": total - val_count,
            "progress_percentage": (val_count / total * 100) if total > 0 else 0
        })
        
    # Processing time trend (mocked for past 7 days for now)
    trend = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=6-i)).strftime("%Y-%m-%d")
        trend.append({
            "date": date,
            "avg_time_ms": 1500 + (100 * (i%3)) # Mock data
        })

    return {
        "total_documents": total_docs,
        "status_breakdown": status_breakdown,
        "avg_ocr_confidence": avg_ocr_confidence,
        "validation_breakdown": validation_breakdown,
        "pending_review_count": pending_review,
        "active_fraud_flags": active_fraud_flags,
        "active_litigation_flags": active_litigation_flags,
        "district_progress": district_progress,
        "processing_time_trend": trend
    }
