from typing import NamedTuple, List
from datetime import datetime

class ValidationResult(NamedTuple):
    passed: bool
    errors: List[str]
    warnings: List[str]

# Seeded list of UP Ghaziabad tehsils
VALID_TEHSILS = ["Ghaziabad", "Modinagar", "Loni"]
VALID_DISTRICTS = ["Ghaziabad"]

def run_business_rules(record: dict) -> ValidationResult:
    errors = []
    warnings = []
    
    # Plot area
    area = record.get("plot_area_sqm", 0)
    if not (1 <= area <= 10000000):
        errors.append(f"Plot area {area} sqm is outside valid bounds (1 to 10,000,000).")
        
    # District / Tehsil
    district = record.get("district", "")
    if district not in VALID_DISTRICTS:
        errors.append(f"District '{district}' is not recognized for this jurisdiction.")
        
    tehsil = record.get("tehsil", "")
    if tehsil not in VALID_TEHSILS:
        warnings.append(f"Tehsil '{tehsil}' is not in the standard list, requires review.")
        
    # Owner Name
    owner_name = record.get("owner_name", "")
    if len(owner_name) < 3:
        errors.append("Owner name is suspiciously short (less than 3 chars).")
        
    # Dates
    reg_date = record.get("registration_date")
    mut_date = record.get("mutation_date")
    now = datetime.now()
    
    if reg_date and isinstance(reg_date, datetime) and reg_date > now:
        errors.append("Registration date cannot be in the future.")
    if mut_date and isinstance(mut_date, datetime) and mut_date > now:
        errors.append("Mutation date cannot be in the future.")
    if reg_date and mut_date and isinstance(reg_date, datetime) and isinstance(mut_date, datetime):
        if mut_date < reg_date:
            errors.append("Mutation date cannot be before registration date.")
            
    passed = len(errors) == 0
    return ValidationResult(passed=passed, errors=errors, warnings=warnings)
