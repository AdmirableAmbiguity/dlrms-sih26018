from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.fraud_flag import FlagType, Severity

class FraudFlagOut(BaseModel):
    id: int
    land_record_id: int
    flag_type: FlagType
    severity: Severity
    description: str
    evidence_json: Optional[Dict[str, Any]] = None
    is_resolved: bool
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class FraudFlagList(BaseModel):
    items: List[FraudFlagOut]
    total: int
