# DLRMS Demo Script

## Step 1: Automated Document Processing (Happy Path)
1. Login as `revenue_officer@demo.com`
2. Navigate to "Document Upload"
3. Upload a sample from `sample_data/clear/`
4. Watch the pipeline progress (Upload -> OCR -> Validation -> Complete)
5. Show that the document was auto-accepted and fields were successfully extracted.

## Step 2: Manual Review (Degraded Document)
1. Upload a sample from `sample_data/review/`
2. Pipeline shows "Needs Review"
3. Navigate to "Review Queue"
4. Open the document to see side-by-side original image and extracted text
5. Manually correct the misread Khasra number or Owner Name
6. Click "Approve and Submit"

## Step 3: Rejection (Invalid Document)
1. Upload a sample from `sample_data/rejected/` (e.g., an invoice)
2. Pipeline shows immediate rejection
3. Rejection reason displayed: "Document type mismatch: Detected Invoice, Expected Land Record."

## Step 4: Blockchain Locking
1. Login as `verifier_admin@demo.com`
2. Go to "Verified Records"
3. Open an approved record and click "Validate Record"
4. Click "Lock on Blockchain"
5. Wait for confirmation and show the resulting Transaction Hash and Block Explorer link.

## Step 5: Fraud Detection Dashboard
1. Navigate to "Fraud Dashboard"
2. View the seeded circular-resale flag for `UP/GZB/LONI/2024/005`
3. Click to view the interactive transfer graph showing User1 -> User2 -> User3 -> User1 in a short timeframe.

## Step 6: GIS Integration (Map View)
1. Open "Map View"
2. Switch to 3D mode
3. Navigate to the Ghaziabad/KIET campus area
4. Hover over a highlighted parcel to view real-time property and ownership info overlaid.

## Step 7: Citizen Verification
1. Go back to Records
2. Generate Certificate for a locked record
3. Download the generated PDF
4. Scan the QR code on the PDF with a mobile device (or click the mock link)
5. Show that the verification page displays "Live & Valid" status pulled directly from the Blockchain.
