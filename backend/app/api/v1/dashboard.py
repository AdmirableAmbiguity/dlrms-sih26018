from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.dashboard.stats import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    return await get_dashboard_stats(db)

@router.get("/accuracy-trend")
async def get_accuracy_trend(db: AsyncSession = Depends(get_db)):
    stats = await get_dashboard_stats(db)
    return {"accuracy_trend": stats["processing_time_trend"]} # Simple mock map

@router.get("/district-progress")
async def district_progress(db: AsyncSession = Depends(get_db)):
    stats = await get_dashboard_stats(db)
    return stats["district_progress"]
