from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class UploadStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    auto_accepted = "auto_accepted"
    needs_review = "needs_review"
    rejected = "rejected"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    upload_status = Column(Enum(UploadStatus), default=UploadStatus.pending)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    ocr_confidence = Column(Float, nullable=True)
    ocr_raw_text = Column(String, nullable=True)
    rejection_reason = Column(String, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    uploader = relationship("User", backref="documents")
