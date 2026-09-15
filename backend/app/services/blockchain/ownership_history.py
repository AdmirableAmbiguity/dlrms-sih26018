from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.mutation_event import MutationEvent
from app.schemas.blockchain import OwnershipHistoryEntry

async def get_ownership_history(land_record_id: int, db: AsyncSession) -> list[OwnershipHistoryEntry]:
    q = select(MutationEvent).where(
        MutationEvent.land_record_id == land_record_id
    ).order_by(MutationEvent.transfer_date.desc())
    
    res = await db.execute(q)
    events = res.scalars().all()
    
    history = []
    for evt in events:
        history.append(OwnershipHistoryEntry.model_validate(evt))
        
    return history
