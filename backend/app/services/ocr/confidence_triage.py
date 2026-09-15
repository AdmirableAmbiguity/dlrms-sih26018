from typing import NamedTuple, List
from app.models.document import UploadStatus

class TriageResult(NamedTuple):
    status: UploadStatus
    confidence: float
    missing_fields: List[str]
    flags: List[str]

REQUIRED_FIELDS = ["owner_name", "survey_number", "khasra_number", "plot_area", "village", "district"]

def triage_document(overall_ocr_confidence: float, extracted_fields: dict) -> TriageResult:
    fields = extracted_fields.get("fields", {})
    field_confs = extracted_fields.get("confidences", {})
    
    missing = [f for f in REQUIRED_FIELDS if f not in fields]
    
    # Calculate overall confidence
    if field_confs:
        avg_field_conf = sum(field_confs.values()) / len(field_confs)
        overall_confidence = (overall_ocr_confidence * 0.4) + (avg_field_conf * 0.6)
    else:
        overall_confidence = overall_ocr_confidence * 0.4

    flags = []
    status = UploadStatus.pending
    
    if overall_confidence >= 0.85 and not missing:
        status = UploadStatus.auto_accepted
    elif overall_confidence >= 0.4:
        status = UploadStatus.needs_review
        if missing:
            flags.append(f"Missing required fields: {', '.join(missing)}")
    else:
        status = UploadStatus.rejected
        flags.append("Overall confidence is too low.")
        
    return TriageResult(status=status, confidence=overall_confidence, missing_fields=missing, flags=flags)
