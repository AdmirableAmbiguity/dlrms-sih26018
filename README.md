# 🏛️ DLRMS — Intelligent Land Record Digitization & Validation System

**Smart India Hackathon 2026 | Problem Statement SIH26018 + SIH26011 (Blockchain add-on)**

A hackathon-grade functional prototype for end-to-end land record digitization in India — upload a scanned document → OCR/extract → validate → detect fraud → view on a 3D map → issue a QR-verified certificate.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React+TS-61DAFB)](https://react.dev)
[![Blockchain](https://img.shields.io/badge/Blockchain-Hardhat+Solidity-yellow)](https://hardhat.org)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL+PostGIS-336791)](https://postgis.net)

## Architecture

```text
+-------------------+       +-----------------------+       +-------------------+
|                   |       |                       |       |                   |
|   React Frontend  |<----->|   FastAPI Backend     |<----->|   PostgreSQL DB   |
|   (Dashboard)     |       |   (Core Logic)        |       |   (PostGIS)       |
|                   |       +-----------+-----------+       +-------------------+
+-------------------+                   |
                                        v
                            +-----------------------+
                            |                       |
                            |   Smart Contracts     |
                            |   (Hardhat/Polygon)   |
                            |                       |
                            +-----------------------+
```

## What's Real vs Simulated

| Feature | Status | Details |
|---|---|---|
| OCR Engine | PaddleOCR (local) / Sarvam AI | Sarvam labeled Simulated if no key |
| Government DB | Simulated — DILRMP sandbox | Seeded PostgreSQL table |
| Blockchain | Local Hardhat / Polygon Amoy | Configurable via env |
| RCCMS | Simulated — RCCMS sandbox | Seeded mock court cases |
| ISRO Bhuvan | Simulated — ISRO Bhuvan | OpenStreetMap tiles |
| Aadhaar e-KYC | Simulated — Mock OTP | Any 6-digit OTP accepted |

## Quick Start

```bash
# Clone the repository
git clone <repo>
cd dlrms

# Setup environment variables
cp .env.example .env

# Build and start services
docker-compose up --build

# Access points
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/docs
# Blockchain node: http://localhost:8545
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Citizen | `citizen@demo.com` | `demo123` |
| Revenue Officer | `officer@demo.com` | `demo123` |
| Verifier / Admin | `admin@demo.com` | `demo123` |

> **Mock OTP**: Enter any 6-digit number when prompted — all OTPs are accepted in demo mode.

## Phase Completion Status
- Phase 1 (Document Upload & OCR): ✅
- Phase 2 (Manual Review & Correction): ✅
- Phase 3 (Verification & Validation): ✅
- Phase 4 (Blockchain Integration): ✅
- Phase 5 (Fraud Detection & GIS): ✅

## Tech Stack
- Frontend: React, Vite, TailwindCSS
- Backend: Python, FastAPI, SQLAlchemy
- DB: PostgreSQL + PostGIS, Redis
- Blockchain: Solidity, Hardhat, Ethers.js
- AI/OCR: Sarvam AI, Tesseract

## Documentation
- [Architecture](docs/architecture.md)
- [API Reference](docs/api-reference.md)
- [Demo Script](docs/demo-script.md)
