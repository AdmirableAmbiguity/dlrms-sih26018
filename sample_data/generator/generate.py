import os
import json
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

# Configuration
VILLAGES = ["Muradnagar", "Loni", "Modinagar", "Hapur", "Dasna", "Garhmukteshwar", "Pilkhuwa", "Bhojpur", "Dhaulana", "Faridnagar"]
TEHSILS = ["Ghaziabad", "Loni", "Modinagar"]
DISTRICT = "Ghaziabad"
NAMES = ["Ramesh Kumar", "Suresh Singh", "Amit Sharma", "Priya Verma", "Sunita Devi", "Rajesh Gupta", "Anil Yadav", "Kavita Tiwari", "Manoj Mishra", "Vikram Singh"]

def generate_text_record(i):
    village = random.choice(VILLAGES)
    tehsil = random.choice(TEHSILS)
    name = NAMES[i % len(NAMES)]
    survey_no = random.randint(100, 999)
    khasra_no = f"{survey_no}/{random.randint(1, 20)}"
    area = round(random.uniform(0.1, 5.0), 4)
    
    return f"""
    GOVERNMENT OF UTTAR PRADESH - REVENUE DEPARTMENT
    KHATAUNI (LAND RECORD)
    ---------------------------------------------------
    District: {DISTRICT}
    Tehsil: {tehsil}
    Village: {village}
    Year: 2023-2024
    
    Owner Details:
    Name: {name}
    
    Land Details:
    Survey Number: {survey_no}
    Khasra Number: {khasra_no}
    Area (Hectares): {area}
    Classification: Agricultural
    
    Mutation Status: Approved
    Mutation Date: 12-Oct-2023
    Remarks: Cleared for sale/transfer.
    """

def create_image(text, filepath, degradation=None):
    # Create white background image
    img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    
    # Try to load a font, fallback to default
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except IOError:
        font = ImageFont.load_default()
        
    d.text((50, 50), text, fill=(0, 0, 0), font=font)
    
    if degradation == 'blur':
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(1.5, 3.5)))
    elif degradation == 'rotate':
        img = img.rotate(random.uniform(2, 8), fillcolor=(255,255,255))
    elif degradation == 'contrast':
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(0.4)
    
    img.save(filepath)

def generate_wrong_doc(i, filepath):
    docs = [
        "INVOICE\n\nItem: Laptop\nQty: 1\nPrice: $1000\nTotal: $1000",
        "To Whom It May Concern\n\nThis is a general letter of recommendation.",
        "CERTIFICATE OF PARTICIPATION\n\nAwarded to Participant #456",
        "MEDICAL PRESCRIPTION\n\nRx: Paracetamol 500mg\nDosage: 1-0-1",
        "JOB APPLICATION FORM\n\nName: _________\nExperience: _________"
    ]
    text = docs[i % len(docs)]
    create_image(text, filepath)

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    clear_dir = os.path.join(base_dir, "clear")
    review_dir = os.path.join(base_dir, "review")
    rejected_dir = os.path.join(base_dir, "rejected")
    
    os.makedirs(clear_dir, exist_ok=True)
    os.makedirs(review_dir, exist_ok=True)
    os.makedirs(rejected_dir, exist_ok=True)
    
    manifest = []
    
    # 1. Clear Docs
    for i in range(10):
        text = generate_text_record(i)
        filename = f"clear_record_{i}.png"
        filepath = os.path.join(clear_dir, filename)
        create_image(text, filepath)
        manifest.append({"filename": filename, "path": f"clear/{filename}", "expected_outcome": "auto_accepted", "description": "Clear land record", "language": "en/hi"})
        
    # 2. Degraded Docs
    degradations = ['blur', 'rotate', 'contrast']
    for i in range(10):
        text = generate_text_record(i+10)
        filename = f"degraded_record_{i}.png"
        filepath = os.path.join(review_dir, filename)
        deg = degradations[i % len(degradations)]
        create_image(text, filepath, degradation=deg)
        manifest.append({"filename": filename, "path": f"review/{filename}", "expected_outcome": "needs_review", "description": f"Degraded land record ({deg})", "language": "en/hi"})
        
    # 3. Wrong Docs
    for i in range(10):
        filename = f"wrong_doc_{i}.png"
        filepath = os.path.join(rejected_dir, filename)
        generate_wrong_doc(i, filepath)
        manifest.append({"filename": filename, "path": f"rejected/{filename}", "expected_outcome": "rejected", "description": "Not a land record", "language": "en"})
        
    manifest_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "manifest.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

if __name__ == "__main__":
    main()
