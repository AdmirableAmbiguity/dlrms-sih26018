from fastapi import APIRouter

from app.services.gis.geo_data import generate_mock_parcels, generate_kiet_buildings, get_bhuvan_tile_config

router = APIRouter(prefix="/gis", tags=["gis"])

@router.get("/parcels")
async def get_parcels():
    return generate_mock_parcels()

@router.get("/parcels/{id}")
async def get_parcel(id: int):
    parcels = generate_mock_parcels()
    for f in parcels["features"]:
        if f["properties"]["id"] == id:
            return f
    return {"error": "Parcel not found"}

@router.get("/kiet-buildings")
async def get_kiet():
    return generate_kiet_buildings()

@router.get("/tile-config")
async def tile_config():
    return get_bhuvan_tile_config()
