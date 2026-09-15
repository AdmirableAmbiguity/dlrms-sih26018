from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.govt_land_record import GovtLandRecord

async def get_govt_record(survey_number: str, khasra_number: str, db: AsyncSession):
    """
    Adapter that queries the GovtLandRecord table simulating an API call.
    """
    q = select(GovtLandRecord).where(
        GovtLandRecord.survey_number == survey_number,
        GovtLandRecord.khasra_number == khasra_number
    )
    result = await db.execute(q)
    return result.scalars().first()
