from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from PIL import Image

from app.models.land_record import LandRecord
from app.services.certificates.qr_generator import generate_qr

def generate_certificate_pdf(record: LandRecord, base_url: str) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Border
    c.setLineWidth(2)
    c.rect(0.5*inch, 0.5*inch, width - 1*inch, height - 1*inch)
    
    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width/2.0, height - 1.2*inch, "GOVERNMENT OF UTTAR PRADESH")
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2.0, height - 1.5*inch, "DIGITAL LAND RECORD CERTIFICATE")
    
    # Line
    c.setLineWidth(1)
    c.line(1*inch, height - 1.7*inch, width - 1*inch, height - 1.7*inch)
    
    # Body
    c.setFont("Helvetica", 12)
    y = height - 2.2*inch
    line_spacing = 25
    
    fields = [
        ("Certificate ID:", record.canonical_id),
        ("Property Owner:", record.owner_name),
        ("Survey Number:", record.survey_number),
        ("Khasra Number:", record.khasra_number),
        ("Khata Number:", record.khata_number or "N/A"),
        ("Plot Area:", f"{record.plot_area_sqm} Sq. Meters"),
        ("Village:", record.village),
        ("Tehsil:", record.tehsil),
        ("District:", record.district),
        ("Registration Number:", record.registration_number or "N/A"),
        ("Validation Status:", record.validation_status.value.upper()),
    ]
    
    for label, value in fields:
        c.drawString(1.2*inch, y, label)
        c.drawString(3.5*inch, y, str(value))
        y -= line_spacing
        
    y -= 10
    c.setFont("Helvetica-Bold", 10)
    c.drawString(1.2*inch, y, "Blockchain Transaction Hash:")
    c.setFont("Helvetica", 10)
    tx_hash = record.blockchain_tx_hash if record.blockchain_tx_hash else "Not Locked on Blockchain"
    c.drawString(1.2*inch, y - 15, tx_hash)
    
    # QR Code
    verify_url = f"{base_url}/api/v1/certificates/verify/{record.canonical_id}"
    qr_bytes = generate_qr(verify_url)
    qr_image = Image.open(BytesIO(qr_bytes))
    
    # Save qr temporarily to draw it
    import tempfile
    import os
    _, temp_path = tempfile.mkstemp(suffix=".png")
    qr_image.save(temp_path)
    
    c.drawImage(temp_path, width - 2.5*inch, 1*inch, width=1.5*inch, height=1.5*inch)
    os.remove(temp_path)
    
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(width - 2.8*inch, 0.8*inch, "Scan to verify authenticity")
    
    # Footer
    c.setFont("Helvetica", 10)
    c.drawCentredString(width/2.0, 0.8*inch, "This is a computer generated certificate. No signature required.")
    
    c.showPage()
    c.save()
    
    return buffer.getvalue()
