from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.mutation_event import EventType

class BlockchainTxOut(BaseModel):
    tx_hash: str
    record_id: int
    owner_address: str
    timestamp: datetime
    status: str
    
    model_config = ConfigDict(from_attributes=True)

class OwnershipHistoryEntry(BaseModel):
    id: int
    from_owner: str
    to_owner: str
    transfer_price: Optional[float] = None
    transfer_date: datetime
    event_type: EventType
    blockchain_tx_hash: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
