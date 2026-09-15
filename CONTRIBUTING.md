# Contributing to DLRMS — SIH26018

Thank you for your interest in contributing! This project was built for **Smart India Hackathon 2026** and is open for community improvements.

## 🚀 Quick Start (Clone & Run)

```bash
# 1. Clone
git clone https://github.com/AdmirableAmbiguity/dlrms-sih26018.git
cd dlrms-sih26018

# 2. Copy environment file
cp .env.example .env

# 3. One-command Docker startup (recommended)
docker-compose up --build

# Frontend → http://localhost:3000
# Backend API + Swagger → http://localhost:8000/docs
# Blockchain node → http://localhost:8545
```

## 🏗️ Project Structure

```
dlrms-sih26018/
├── frontend/              # React 18 + TypeScript + Tailwind + Three.js
│   └── src/
│       ├── pages/         # 11 pages (Login, Dashboard, Upload, Review, Map, etc.)
│       ├── components/    # Reusable components (3D map, charts, blockchain UI)
│       ├── store/         # Zustand auth + upload state
│       └── types/         # TypeScript interfaces
├── backend/               # FastAPI + SQLAlchemy + PostgreSQL/PostGIS
│   └── app/
│       ├── api/v1/        # 10 REST API routers
│       ├── models/        # 9 SQLAlchemy ORM models
│       ├── schemas/       # Pydantic request/response schemas
│       └── services/      # OCR, validation, blockchain, GIS, certs
├── blockchain/            # Hardhat + Solidity smart contracts
│   ├── contracts/         # LandRegistry.sol
│   └── scripts/           # deploy.js + seed.js
├── sample_data/           # 30 synthetic test documents (PNG)
│   ├── clear/             # 10 clean land records → auto_accepted
│   ├── review/            # 10 degraded records → needs_review
│   └── rejected/          # 10 wrong-type docs → rejected
└── docs/                  # Architecture, API reference, demo script
```

## 🧩 Modules You Can Extend

| Module | File(s) | Extension Ideas |
|---|---|---|
| OCR Engine | `backend/app/services/ocr/` | Add Hindi/regional language models, Sarvam AI real key |
| Fraud Detection | `backend/app/services/blockchain/fraud_detector.py` | Add more graph patterns, ML classifier |
| 3D Map | `frontend/src/components/map/CityMap3D.tsx` | Add real GeoJSON from OpenStreetMap, satellite texture |
| Validation | `backend/app/services/validation/` | Add Aadhaar UIDAI verification |
| Certificates | `backend/app/services/certificates/` | Add Hindi PDF, digital signature |
| DILRMP Connector | `backend/app/services/connectors/dilrmp_mock.py` | Swap mock → real DILRMP REST API |
| Blockchain | `blockchain/contracts/LandRegistry.sol` | Deploy to Polygon Amoy testnet |

## 🔧 Running Without Docker (Dev Mode)

### Backend
```bash
cd backend
pip install -r requirements-cloud.txt   # lightweight
# or
pip install -r requirements.txt          # full ML deps

# Set env vars (or copy .env.example to .env)
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev    # → http://localhost:5173
```

### Blockchain (optional)
```bash
cd blockchain
npm install
npx hardhat node                    # Start local chain
npx hardhat run scripts/deploy.js --network localhost
```

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

## 📋 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Citizen | `citizen@demo.com` | `demo123` |
| Revenue Officer | `officer@demo.com` | `demo123` |
| Verifier / Admin | `admin@demo.com` | `demo123` |

> OTP: any 6 digits accepted in demo mode

## 🧾 Sample Test Documents

Located in `sample_data/` — use these to test the upload pipeline:

| Folder | Count | Expected Result | Use Case |
|---|---|---|---|
| `sample_data/clear/` | 10 PNGs | ✅ `auto_accepted` | Clean Khatauni scans |
| `sample_data/review/` | 10 PNGs | ⚠️ `needs_review` | Blurred/rotated/low-contrast |
| `sample_data/rejected/` | 10 PNGs | ❌ `rejected` | Invoice, prescription, letter |

## 🌐 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://dlrms:dlrms@localhost:5432/dlrms` | Async DB URL |
| `REDIS_URL` | `redis://localhost:6379` | Redis for OTP/cache |
| `SECRET_KEY` | (generate one) | JWT signing key |
| `SARVAM_API_KEY` | (empty) | Sarvam AI OCR — falls back to PaddleOCR if empty |
| `BLOCKCHAIN_RPC_URL` | `http://localhost:8545` | Hardhat local or Polygon Amoy |
| `ENVIRONMENT` | `development` | Seeds mock data on startup |

## 📝 Commit Convention

```
feat: add Aadhaar e-KYC integration
fix: fraud detector circular resale edge case
docs: update API reference for /records
chore: upgrade PaddleOCR to 2.8
```

## 📄 License

MIT — free to use, modify, and distribute.
