from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.land_record import LandRecord
from app.services.blockchain.chain_client import get_record_on_chain

async def verify_certificate(canonical_id: str, db: AsyncSession) -> Dict[str, Any]:
    # Check DB
    q = select(LandRecord).where(LandRecord.canonical_id == canonical_id)
    res = await db.execute(q)
    record = res.scalars().first()
    
    if not record:
        return {"valid": False, "message": "Certificate not found in database"}
        
    # Check Blockchain
    if record.is_blockchain_locked and record.id:
        chain_data = await get_record_on_chain(record.id)
        if chain_data:
            return {
                "valid": True,
                "message": "Certificate verified successfully on blockchain",
                "owner": record.owner_name,
                "chain_data": chain_data
            }
            
    return {
        "valid": True,
        "message": "Certificate exists in database but is not locked on blockchain.",
        "owner": record.owner_name
    }
