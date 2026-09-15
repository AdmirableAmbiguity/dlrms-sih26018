from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.blockchain.chain_client import get_record_on_chain, get_transfer_history

router = APIRouter(prefix="/blockchain", tags=["blockchain"])

@router.get("/record/{id}")
async def read_chain_record(
    id: int,
    db: AsyncSession = Depends(get_db)
):
    data = await get_record_on_chain(id)
    if not data:
        raise HTTPException(status_code=404, detail="Record not found on chain")
    return data

@router.get("/tx/{tx_hash}")
async def get_tx_details(
    tx_hash: str
):
    # Mock endpoint for tx details
    return {
        "tx_hash": tx_hash,
        "status": "Success",
        "blockNumber": 1234567,
        "source": "Simulated — Blockchain sandbox"
    }
