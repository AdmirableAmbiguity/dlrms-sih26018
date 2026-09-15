from typing import Dict, Any

def normalize_fields(fields: Dict[str, Any]) -> Dict[str, Any]:
    normalized = {}
    
    # Names to Title Case
    if "owner_name" in fields:
        normalized["owner_name"] = str(fields["owner_name"]).title()
    if "village" in fields:
        normalized["village"] = str(fields["village"]).title()
    if "tehsil" in fields:
        normalized["tehsil"] = str(fields["tehsil"]).title()
    if "district" in fields:
        normalized["district"] = str(fields["district"]).title()
        
    # Area Conversion (convert all to sqm)
    if "plot_area" in fields:
        try:
            area_val = float(fields["plot_area"])
            unit = fields.get("plot_area_unit", "sqm").lower()
            
            # Simple conversions
            if unit in ["bigha", "बीघा"]:
                area_val = area_val * 2529.28 # UP standard roughly
            elif unit in ["acre", "एकड़"]:
                area_val = area_val * 4046.86
            elif unit in ["hectare"]:
                area_val = area_val * 10000
                
            normalized["plot_area_sqm"] = area_val
        except (ValueError, TypeError):
            normalized["plot_area_sqm"] = 0.0

    # Pass through numbers as is, just clean whitespace
    for num_field in ["survey_number", "khasra_number", "khata_number"]:
        if num_field in fields:
            normalized[num_field] = str(fields[num_field]).strip()
            
    return normalized
