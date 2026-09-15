from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.document import UploadStatus

class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    status: UploadStatus
    message: str
    
    model_config = ConfigDict(from_attributes=True)

class DocumentOut(BaseModel):
    id: int
    filename: str
    file_size: int
    mime_type: str
    upload_status: UploadStatus
    ocr_confidence: Optional[float] = None
    ocr_raw_text: Optional[str] = None
    rejection_reason: Optional[str] = None
    processing_time_ms: Optional[int] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DocumentListOut(BaseModel):
    items: List[DocumentOut]
    total: int
