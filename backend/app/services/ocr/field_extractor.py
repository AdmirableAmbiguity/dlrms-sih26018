import re
import spacy
from typing import Dict, Any

# Load spaCy model for NER (English for now, can be expanded to multi-lingual)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Handle if model not downloaded
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

class ExtractedFields(Dict):
    pass

def extract_fields(text: str) -> ExtractedFields:
    fields = {}
    confidences = {}
    
    # 1. Owner Name
    doc = nlp(text)
    persons = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]
    if persons:
        fields["owner_name"] = persons[0]
        confidences["owner_name"] = 0.85
    else:
        # Fallback to regex (crude)
        owner_match = re.search(r'(?:Name|Owner|नाम|स्वामी)\s*[:\-]?\s*([A-Za-z\s]+)', text, re.IGNORECASE)
        if owner_match:
            fields["owner_name"] = owner_match.group(1).strip()
            confidences["owner_name"] = 0.60
            
    # 2. Survey Number
    survey_match = re.search(r'Survey\s*No\.?\s*[:\-]?\s*([\d\w\-/]+)', text, re.IGNORECASE)
    if survey_match:
        fields["survey_number"] = survey_match.group(1).strip()
        confidences["survey_number"] = 0.90
        
    # 3. Khasra Number
    khasra_match = re.search(r'(?:Khasra|खसरा)\s*(?:No\.?)?\s*[:\-]?\s*([\d\w\-/]+)', text, re.IGNORECASE)
    if khasra_match:
        fields["khasra_number"] = khasra_match.group(1).strip()
        confidences["khasra_number"] = 0.90

    # 4. Khata Number
    khata_match = re.search(r'(?:Khata|खाता)\s*(?:No\.?)?\s*[:\-]?\s*([\d\w\-/]+)', text, re.IGNORECASE)
    if khata_match:
        fields["khata_number"] = khata_match.group(1).strip()
        confidences["khata_number"] = 0.90
        
    # 5. Plot Area
    area_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:sq\.?\s*(?:m|mt|meter|metre|ft|feet|bigha|acre|hectare|dismil)|वर्गमीटर|बीघा|एकड़)', text, re.IGNORECASE)
    if area_match:
        fields["plot_area"] = area_match.group(1).strip()
        fields["plot_area_unit"] = "sqm" # We'll normalize this later
        confidences["plot_area"] = 0.85
        
    # 6. Village/Tehsil/District
    village_match = re.search(r'(?:Village|ग्राम)\s*[:\-]?\s*([A-Za-z]+)', text, re.IGNORECASE)
    if village_match:
        fields["village"] = village_match.group(1).strip()
        confidences["village"] = 0.80

    district_match = re.search(r'(?:District|Zila|जिला)\s*[:\-]?\s*([A-Za-z]+)', text, re.IGNORECASE)
    if district_match:
        fields["district"] = district_match.group(1).strip()
        confidences["district"] = 0.80

    tehsil_match = re.search(r'(?:Tehsil|तहसील)\s*[:\-]?\s*([A-Za-z]+)', text, re.IGNORECASE)
    if tehsil_match:
        fields["tehsil"] = tehsil_match.group(1).strip()
        confidences["tehsil"] = 0.80

    result = ExtractedFields(fields=fields, confidences=confidences)
    return result
