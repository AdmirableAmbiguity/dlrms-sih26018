import time
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.models.document import Document, UploadStatus
from app.models.land_record import LandRecord, ValidationStatus
from app.services.ocr.ocr_engine import run_ocr
from app.services.ocr.document_gate import classify_document
from app.services.ocr.field_extractor import extract_fields
from app.services.ocr.confidence_triage import triage_document
from app.services.validation.schema_normalizer import normalize_fields

class ProcessingResult(Dict):
    pass

async def run_ocr_pipeline(document_id: int, db_session: AsyncSession) -> ProcessingResult:
    start_time = time.time()
    
    doc = await db_session.get(Document, document_id)
    if not doc:
        return {"error": "Document not found"}
        
    doc.upload_status = UploadStatus.processing
    await db_session.commit()

    try:
        # 1. OCR Engine
        ocr_res = await run_ocr(doc.file_path, doc.mime_type)
        doc.ocr_raw_text = ocr_res.text
        doc.ocr_confidence = ocr_res.confidence
        
        # 2. Document Gate
        is_land_record, rejection_reason = classify_document(ocr_res.text, doc.file_path)
        if not is_land_record:
            doc.upload_status = UploadStatus.rejected
            doc.rejection_reason = rejection_reason
            await db_session.commit()
            return {"status": "rejected", "reason": rejection_reason}
            
        # 3. Extract Fields
        extracted = extract_fields(ocr_res.text)
        
        # 4. Triage
        triage_res = triage_document(ocr_res.confidence, extracted)
        
        doc.upload_status = triage_res.status
        if triage_res.status == UploadStatus.rejected:
            doc.rejection_reason = " | ".join(triage_res.flags)
        
        doc.processing_time_ms = int((time.time() - start_time) * 1000)
        
        # If accepted or needs review, save to LandRecord
        if triage_res.status in [UploadStatus.auto_accepted, UploadStatus.needs_review]:
            norm_fields = normalize_fields(extracted.get("fields", {}))
            
            lr = LandRecord(
                document_id=doc.id,
                canonical_id=str(uuid.uuid4()),
                owner_name=norm_fields.get("owner_name", "Unknown"),
                survey_number=norm_fields.get("survey_number", "Unknown"),
                khasra_number=norm_fields.get("khasra_number", "Unknown"),
                plot_area_sqm=norm_fields.get("plot_area_sqm", 0.0),
                village=norm_fields.get("village", "Unknown"),
                tehsil=norm_fields.get("tehsil", "Unknown"),
                district=norm_fields.get("district", "Unknown"),
                validation_status=ValidationStatus.pending
            )
            db_session.add(lr)
            
        await db_session.commit()
        return {"status": doc.upload_status.value, "confidence": triage_res.confidence}
        
    except Exception as e:
        doc.upload_status = UploadStatus.rejected
        doc.rejection_reason = f"Pipeline error: {str(e)}"
        await db_session.commit()
        return {"status": "error", "error": str(e)}
