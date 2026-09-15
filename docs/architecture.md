# Architecture Document

## System Overview
DLRMS is designed to act as a secure bridge between legacy paper-based land records and a modern, immutable blockchain-backed registry.

## Modules

### 1. Document Ingestion & OCR
- **Input:** Scanned images (PNG, JPEG, PDF)
- **Process:** Tesseract/PaddleOCR for initial text extraction, Sarvam AI for multilingual (Hindi/English) semantic parsing.
- **Output:** Structured JSON data (Owner, Khasra, Area, etc.)

### 2. Validation Engine
- Checks against simulated DILRMP databases.
- Applies heuristic rules (e.g., Area cannot be negative, Khasra format validation).

### 3. Blockchain Layer
- Built on Polygon Amoy (Testnet) for low fees and fast finality.
- Smart Contract `LandRegistry.sol` stores a cryptographic hash of the record data. It does not store PII directly on-chain.

### 4. GIS Module
- Utilizes PostGIS for spatial queries.
- Frontend uses Leaflet/Mapbox for parcel rendering and 3D visualization.

## Data Flow
```
[Citizen/Officer] -> (Uploads Image) -> [FastAPI] -> (Sends to OCR) -> [AI Model]
                                          |
                                          v
                                    (Structures Data)
                                          |
                                          v
                                   [Validation Engine]
                                   /                 \
                          (Passes)                 (Fails)
                             |                        |
                      [PostgreSQL]             [Review Queue]
                             |
                     [Admin Approves]
                             |
                     (Hashes Data)
                             |
                     [Smart Contract] <--- (Locks Record Immutable)
```

## Security Model
- Role-based Access Control (RBAC) via JWT.
- PII is encrypted at rest in PostgreSQL.
- Only keccak256 hashes of the canonical record are stored on the public blockchain.
