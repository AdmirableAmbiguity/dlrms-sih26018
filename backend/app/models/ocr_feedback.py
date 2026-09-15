from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class OCRFeedback(Base):
    __tablename__ = "ocr_feedback"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    field_name = Column(String, nullable=False)
    original_value = Column(String, nullable=True)
    corrected_value = Column(String, nullable=False)
    corrected_by = Column(Integer, ForeignKey("users.id"))
    correction_timestamp = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", backref="feedbacks")
    user = relationship("User", backref="ocr_feedbacks")
