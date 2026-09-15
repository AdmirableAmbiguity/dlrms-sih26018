import random

def generate_mock_parcels() -> dict:
    """
    Generates synthetic but plausible GeoJSON for Ghaziabad cadastral parcels,
    centered around KIET: lat 28.7512, lng 77.4924
    """
    base_lat = 28.7512
    base_lng = 77.4924
    
    features = []
    
    for i in range(50):
        # Generate a random polygon near base
        lat_offset = (random.random() - 0.5) * 0.01
        lng_offset = (random.random() - 0.5) * 0.01
        
        lat = base_lat + lat_offset
        lng = base_lng + lng_offset
        
        # Create a small roughly square parcel
        size = 0.0005
        coords = [
            [lng, lat],
            [lng + size, lat],
            [lng + size, lat + size],
            [lng, lat + size],
            [lng, lat]
        ]
        
        features.append({
            "type": "Feature",
            "properties": {
                "id": i + 1,
                "survey_number": f"70/{i+1}",
                "owner_type": random.choice(["individual", "government", "commercial"]),
                "area_sqm": random.randint(100, 5000)
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [coords]
            }
        })
        
    return {
        "type": "FeatureCollection",
        "features": features
    }

def generate_kiet_buildings() -> dict:
    base_lat = 28.7512
    base_lng = 77.4924
    
    features = []
    heights = [12, 18, 24, 8, 6]
    
    for i, h in enumerate(heights):
        lat_offset = (random.random() - 0.5) * 0.002
        lng_offset = (random.random() - 0.5) * 0.002
        
        lat = base_lat + lat_offset
        lng = base_lng + lng_offset
        size = 0.0002
        
        coords = [
            [lng, lat],
            [lng + size, lat],
            [lng + size, lat + size],
            [lng, lat + size],
            [lng, lat]
        ]
        
        features.append({
            "type": "Feature",
            "properties": {
                "name": f"KIET Block {chr(65+i)}",
                "height_m": h
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [coords]
            }
        })
        
    return {
        "type": "FeatureCollection",
        "features": features
    }

def get_bhuvan_tile_config() -> dict:
    return {
        "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "attribution": "Simulated — ISRO Bhuvan (using OSM tiles)",
        "source": "Simulated — ISRO Bhuvan sandbox"
    }
