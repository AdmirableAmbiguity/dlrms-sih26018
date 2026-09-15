from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.court_case import CourtCase

async def get_all_mock_cases(db: AsyncSession):
    """
    Returns all seeded court cases from RCCMS sandbox
    """
    q = select(CourtCase)
    res = await db.execute(q)
    return res.scalars().all()
