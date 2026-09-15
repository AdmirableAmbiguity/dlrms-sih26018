from rapidfuzz import fuzz
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from app.models.court_case import CourtCase, CaseStatus

async def match_against_rccms(owner_name: str, survey_number: str, db: AsyncSession) -> List[Dict[str, Any]]:
    # Fetch all active/pending cases to fuzzy match
    q = select(CourtCase).where(
        CourtCase.case_status.in_([CaseStatus.pending, CaseStatus.active, CaseStatus.stayed])
    )
    res = await db.execute(q)
    cases = res.scalars().all()
    
    matches = []
    for c in cases:
        # Check survey match
        survey_match = False
        if c.survey_reference and survey_number:
            if c.survey_reference == survey_number:
                survey_match = True
                
        # Fuzzy match names
        petitioner_sim = fuzz.partial_ratio(owner_name.lower(), c.petitioner.lower())
        respondent_sim = fuzz.partial_ratio(owner_name.lower(), c.respondent.lower())
        
        name_match = (petitioner_sim > 80) or (respondent_sim > 80)
        
        if survey_match or name_match:
            matches.append({
                "case_number": c.case_number,
                "court_name": c.court_name,
                "status": c.case_status.value,
                "survey_match": survey_match,
                "name_match_score": max(petitioner_sim, respondent_sim) if name_match else 0
            })
            
    return matches
