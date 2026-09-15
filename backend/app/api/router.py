from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.documents import router as documents_router
from app.api.v1.review import router as review_router
from app.api.v1.records import router as records_router
from app.api.v1.fraud import router as fraud_router
from app.api.v1.blockchain import router as blockchain_router
from app.api.v1.rccms import router as rccms_router
from app.api.v1.gis import router as gis_router
from app.api.v1.certificates import router as certificates_router
from app.api.v1.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(documents_router)
api_router.include_router(review_router)
api_router.include_router(records_router)
api_router.include_router(fraud_router)
api_router.include_router(blockchain_router)
api_router.include_router(rccms_router)
api_router.include_router(gis_router)
api_router.include_router(certificates_router)
api_router.include_router(dashboard_router)
