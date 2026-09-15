from pydantic import BaseModel
from typing import Dict, List, Any

class DistrictProgress(BaseModel):
    district: str
    total_records: int
    validated_records: int
    pending_records: int
    progress_percentage: float

class DashboardStats(BaseModel):
    total_documents: int
    status_breakdown: Dict[str, int]
    avg_ocr_confidence: float
    validation_breakdown: Dict[str, int]
    pending_review_count: int
    active_fraud_flags: Dict[str, int]
    active_litigation_flags: int
    district_progress: List[DistrictProgress]
    processing_time_trend: List[Dict[str, Any]]
