# DLRMS Sample Data

This directory contains synthetic land records and other documents for testing the Document OCR and Verification pipeline of DLRMS.

## Structure
- `clear/`: Clean, well-formatted synthetic land records. Expected outcome: `auto_accepted`.
- `review/`: Degraded documents (blur, low contrast, rotation) that simulate old or poorly scanned records. Expected outcome: `needs_review`.
- `rejected/`: Documents that are clearly not land records (invoices, prescriptions). Expected outcome: `rejected`.
- `generator/`: Python script to generate these documents.

## How to Regenerate
1. Navigate to `generator/`
2. Run `python generate.py` (Requires `Pillow` installed: `pip install Pillow`)
3. The script will output 30 PNG images into the respective folders and update `manifest.json`.

## Expected Outcomes
The pipeline evaluates documents based on text extraction confidence and semantic understanding:
- **Auto-Accepted**: Document type matches Land Record, confidence is high, and all required fields (Survey No, Khasra No, Owner Name, etc.) are extracted successfully.
- **Needs Review**: Document type is likely correct, but OCR confidence is low, or some required fields are missing due to degradation.
- **Rejected**: Document type is determined to be invalid (e.g., invoice).
