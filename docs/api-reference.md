# API Reference

## Authentication
- `POST /api/auth/login` - Returns JWT token
- `POST /api/auth/register` - Register a new officer

## Documents
- `POST /api/documents/upload` - Upload a scanned record (Multipart form)
- `GET /api/documents/{doc_id}` - Get status of uploaded document
- `GET /api/documents/review-queue` - Get list of documents needing review
- `PUT /api/documents/{doc_id}/approve` - Approve and correct fields
- `PUT /api/documents/{doc_id}/reject` - Reject document manually

## Records
- `GET /api/records/` - List all verified records
- `GET /api/records/{canonical_id}` - Get specific record details
- `POST /api/records/{canonical_id}/lock` - Trigger blockchain lock

## Blockchain
- `GET /api/blockchain/verify/{canonical_id}` - Verify record hash on-chain
- `GET /api/blockchain/history/{canonical_id}` - Get transfer history

## Fraud Detection
- `GET /api/fraud/alerts` - Get active fraud alerts (circular transfers, rapid resales)

## GIS
- `GET /api/gis/parcels` - Get GeoJSON of land parcels in viewport
- `GET /api/gis/parcel/{khasra_no}` - Get specific parcel boundaries
