from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class EventType(str, enum.Enum):
    sale = "sale"
    inheritance = "inheritance"
    gift = "gift"
    partition = "partition"
    correction = "correction"

class MutationEvent(Base):
    __tablename__ = "mutation_events"

    id = Column(Integer, primary_key=True, index=True)
    land_record_id = Column(Integer, ForeignKey("land_records.id"))
    from_owner = Column(String, nullable=False)
    to_owner = Column(String, nullable=False)
    transfer_price = Column(Float, nullable=True)
    transfer_date = Column(DateTime(timezone=True), nullable=False)
    event_type = Column(Enum(EventType), nullable=False)
    blockchain_tx_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    land_record = relationship("LandRecord", backref="mutations")
