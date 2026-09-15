"""
Seed data for DLRMS development environment.
Uses realistic Ghaziabad, Uttar Pradesh data.
"""
import uuid
from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole
from app.models.govt_land_record import GovtLandRecord
from app.models.court_case import CourtCase, CaseStatus
from app.models.land_record import LandRecord, ValidationStatus, LandClassification, OwnershipType
from app.models.mutation_event import MutationEvent, EventType
from app.models.fraud_flag import FraudFlag, FlagType, Severity
from app.core.security import hash_password

# Realistic North Indian owner names
OWNER_NAMES = [
    "Ramesh Chandra Gupta", "Sunita Devi Sharma", "Mahesh Kumar Yadav",
    "Priya Verma", "Ajay Singh Chauhan", "Geeta Rani Mishra",
    "Vijay Kumar Pandey", "Anita Kumari", "Rakesh Agarwal",
    "Savita Rani Tiwari", "Dinesh Prasad", "Kamla Devi",
    "Suresh Lal Gupta", "Mohan Das Srivastava", "Pushpa Rani Yadav",
    "Rajendra Singh Rawat", "Usha Devi", "Narendra Kumar Jain",
    "Sushila Rani Verma", "Bharat Bhushan Sharma",
]

# Real Ghaziabad area villages/localities
VILLAGES = [
    "Muradnagar", "Loni", "Modinagar", "Dasna", "Hapur Road",
    "Raj Nagar", "Vijay Nagar", "Kavi Nagar", "Shalimar Garden",
    "Indirapuram", "Vaishali", "Crossings Republik", "Tronica City",
    "Masuri", "Bhojpur", "Duhai", "Arthala", "Nandgram",
    "Khoda Colony", "Pratap Vihar",
]

TEHSILS = {
    "Muradnagar": "Muradnagar", "Loni": "Loni", "Modinagar": "Modinagar",
    "Dasna": "Ghaziabad Sadar", "Hapur Road": "Ghaziabad Sadar",
    "Raj Nagar": "Ghaziabad Sadar", "Vijay Nagar": "Ghaziabad Sadar",
    "Kavi Nagar": "Ghaziabad Sadar", "Shalimar Garden": "Ghaziabad Sadar",
    "Indirapuram": "Ghaziabad Sadar", "Vaishali": "Ghaziabad Sadar",
    "Crossings Republik": "Ghaziabad Sadar", "Tronica City": "Loni",
    "Masuri": "Modinagar", "Bhojpur": "Ghaziabad Sadar",
    "Duhai": "Ghaziabad Sadar", "Arthala": "Loni",
    "Nandgram": "Ghaziabad Sadar", "Khoda Colony": "Ghaziabad Sadar",
    "Pratap Vihar": "Ghaziabad Sadar",
}

LAND_CLASSIFICATIONS = [
    LandClassification.agricultural,
    LandClassification.residential,
    LandClassification.commercial,
    LandClassification.agricultural,
    LandClassification.residential,
    LandClassification.agricultural,
    LandClassification.industrial,
    LandClassification.residential,
    LandClassification.agricultural,
    LandClassification.residential,
]

COURT_CASES = [
    {"petitioner": "Ramesh Chandra Gupta", "respondent": "Sunita Devi Sharma", "case": "Land boundary dispute", "survey": "70/12", "khasra": "112"},
    {"petitioner": "State of UP", "respondent": "Mahesh Kumar Yadav", "case": "Encroachment on govt land", "survey": "45/7", "khasra": "207"},
    {"petitioner": "Vijay Kumar Pandey", "respondent": "Ajay Singh Chauhan", "case": "Title dispute post-partition", "survey": "88/3", "khasra": "303"},
    {"petitioner": "Anita Kumari", "respondent": "Rakesh Agarwal", "case": "Forgery of mutation records", "survey": "70/5", "khasra": "105"},
    {"petitioner": "Loni Development Authority", "respondent": "Dinesh Prasad", "case": "Unauthorized construction", "survey": "61/19", "khasra": "419"},
    {"petitioner": "Narendra Kumar Jain", "respondent": "Mohan Das Srivastava", "case": "Inheritance dispute", "survey": "33/8", "khasra": "208"},
    {"petitioner": "Sushila Rani Verma", "respondent": "Bharat Bhushan Sharma", "case": "Sale deed challenge", "survey": "70/14", "khasra": "114"},
    {"petitioner": "GDA (Ghaziabad Dev Auth)", "respondent": "Kamla Devi", "case": "Acquisition compensation", "survey": "22/11", "khasra": "311"},
    {"petitioner": "Priya Verma", "respondent": "Geeta Rani Mishra", "case": "Joint ownership dispute", "survey": "55/6", "khasra": "506"},
    {"petitioner": "Savita Rani Tiwari", "respondent": "Pushpa Rani Yadav", "case": "Mortgage default", "survey": "70/9", "khasra": "109"},
    {"petitioner": "Rajendra Singh Rawat", "respondent": "Usha Devi", "case": "Gift deed cancellation", "survey": "91/2", "khasra": "202"},
    {"petitioner": "State of UP Forest Dept", "respondent": "Suresh Lal Gupta", "case": "Forest land encroachment", "survey": "14/16", "khasra": "616"},
    {"petitioner": "Vijay Kumar Pandey", "respondent": "Narendra Kumar Jain", "case": "Partition suit", "survey": "70/3", "khasra": "103"},
    {"petitioner": "Tronica City RWA", "respondent": "Mahesh Kumar Yadav", "case": "Common area misuse", "survey": "77/4", "khasra": "404"},
    {"petitioner": "Ajay Singh Chauhan", "respondent": "Ramesh Chandra Gupta", "case": "Right of way dispute", "survey": "70/1", "khasra": "101"},
    {"petitioner": "Anita Kumari", "respondent": "Dinesh Prasad", "case": "Lease termination", "survey": "63/15", "khasra": "315"},
    {"petitioner": "GDA", "respondent": "Bharat Bhushan Sharma", "case": "Zoning violation", "survey": "70/20", "khasra": "120"},
    {"petitioner": "Kamla Devi", "respondent": "Suresh Lal Gupta", "case": "Agricultural land conversion", "survey": "38/10", "khasra": "210"},
    {"petitioner": "Geeta Rani Mishra", "respondent": "Savita Rani Tiwari", "case": "Will contestation", "survey": "70/17", "khasra": "117"},
    {"petitioner": "Mohan Das Srivastava", "respondent": "Priya Verma", "case": "Construction encroachment", "survey": "51/13", "khasra": "313"},
]


async def seed_data(db: AsyncSession):
    """Seed the database with realistic development data. Idempotent."""
    # Check if already seeded
    res = await db.execute(select(User))
    if res.scalars().first():
        return

    print("🌱 Seeding DLRMS database with Ghaziabad demo data...")

    # ── Users ──────────────────────────────────────────────────────────────────
    users = [
        User(email="citizen@demo.com", full_name="Ramesh Chandra Gupta",
             hashed_password=hash_password("demo123"), role=UserRole.citizen),
        User(email="officer@demo.com", full_name="Patwari Surendra Singh",
             hashed_password=hash_password("demo123"), role=UserRole.revenue_officer),
        User(email="admin@demo.com", full_name="Tehsildar Arun Sharma",
             hashed_password=hash_password("demo123"), role=UserRole.verifier_admin),
    ]
    db.add_all(users)
    await db.flush()

    # ── Government Land Records (DILRMP mock) ─────────────────────────────────
    for i, (owner, village) in enumerate(zip(OWNER_NAMES, VILLAGES), start=1):
        tehsil = TEHSILS.get(village, "Ghaziabad Sadar")
        land_class = LAND_CLASSIFICATIONS[i % len(LAND_CLASSIFICATIONS)]
        area = 200.0 + (i * 47.3) + ((i % 5) * 100)
        glr = GovtLandRecord(
            source_system="DILRMP",
            external_id=f"DILRMP-UP-GZB-{i:04d}",
            owner_name=owner,
            survey_number=f"{(i % 8) + 40}/{i}",
            khasra_number=f"{100 + i}",
            plot_area_sqm=round(area, 2),
            village=village,
            tehsil=tehsil,
            district="Ghaziabad",
            registration_number=f"GZB/REG/{2015 + (i % 8)}/{i:04d}",
            registration_date=datetime(2015 + (i % 8), (i % 12) + 1, (i % 28) + 1),
            raw_data={
                "source_label": "Simulated — DILRMP sandbox",
                "land_classification": land_class.value,
                "state": "Uttar Pradesh",
            },
        )
        db.add(glr)

    await db.flush()

    # ── Court Cases (RCCMS mock) ───────────────────────────────────────────────
    statuses = [CaseStatus.pending, CaseStatus.active, CaseStatus.stayed,
                CaseStatus.pending, CaseStatus.active]
    for i, case_data in enumerate(COURT_CASES, start=1):
        cc = CourtCase(
            case_number=f"C.S. {2021 + (i % 4)}/{i:03d}",
            court_name="Civil Judge (Senior Division) Ghaziabad",
            petitioner=case_data["petitioner"],
            respondent=case_data["respondent"],
            survey_reference=case_data["survey"],
            khasra_reference=case_data["khasra"],
            case_status=statuses[i % len(statuses)],
            filing_date=datetime.now() - timedelta(days=180 + (i * 15)),
            next_hearing_date=datetime.now() + timedelta(days=30 + (i * 7)),
            is_simulated=True,
        )
        db.add(cc)

    await db.flush()

    # ── Processed Land Records ─────────────────────────────────────────────────
    validation_statuses = [
        ValidationStatus.validated, ValidationStatus.validated, ValidationStatus.validated,
        ValidationStatus.validated, ValidationStatus.validated, ValidationStatus.validated,
        ValidationStatus.validated, ValidationStatus.validated, ValidationStatus.conflict,
        ValidationStatus.needs_review, ValidationStatus.validated, ValidationStatus.validated,
        ValidationStatus.needs_review, ValidationStatus.validated, ValidationStatus.pending,
    ]
    land_record_ids = []

    for i, (owner, village) in enumerate(zip(OWNER_NAMES[:15], VILLAGES[:15]), start=1):
        tehsil = TEHSILS.get(village, "Ghaziabad Sadar")
        v_status = validation_statuses[i - 1]
        is_locked = v_status == ValidationStatus.validated and i <= 8
        tx_hash = f"0x{uuid.uuid4().hex[:40]}{'a' * 24}" if is_locked else None

        lr = LandRecord(
            canonical_id=f"GZB-{village[:3].upper()}-{i:04d}",
            owner_name=owner,
            survey_number=f"{(i % 8) + 40}/{i}",
            khasra_number=f"{100 + i}",
            khata_number=f"KH-{200 + i}",
            plot_area_sqm=round(200.0 + (i * 47.3) + ((i % 5) * 100), 2),
            village=village,
            tehsil=tehsil,
            district="Ghaziabad",
            state="Uttar Pradesh",
            land_classification=LAND_CLASSIFICATIONS[i % len(LAND_CLASSIFICATIONS)],
            ownership_type=OwnershipType.individual,
            registration_number=f"GZB/REG/{2015 + (i % 8)}/{i:04d}",
            registration_date=datetime(2015 + (i % 8), (i % 12) + 1, (i % 28) + 1),
            mutation_number=f"MUT/{2018 + (i % 5)}/{i:03d}" if i % 3 != 0 else None,
            mutation_date=datetime(2018 + (i % 5), (i % 12) + 1, 10) if i % 3 != 0 else None,
            validation_status=v_status,
            is_blockchain_locked=is_locked,
            blockchain_tx_hash=tx_hash,
        )
        db.add(lr)
        await db.flush()
        land_record_ids.append(lr.id)

        # Normal mutation history (5 events per record)
        base_price = 500000 + (i * 120000)
        prev_owner = f"Previous Owner {i}-A"
        for j in range(5):
            next_owner = owner if j == 4 else f"Previous Owner {i}-{chr(66 + j)}"
            me = MutationEvent(
                land_record_id=lr.id,
                from_owner=prev_owner,
                to_owner=next_owner,
                transfer_price=base_price + (j * 75000),
                transfer_date=datetime.now() - timedelta(days=365 * (5 - j)),
                event_type=EventType.sale if j % 3 != 2 else EventType.inheritance,
                blockchain_tx_hash=f"0x{uuid.uuid4().hex}" if is_locked else None,
            )
            db.add(me)
            prev_owner = next_owner

    await db.flush()

    # ── Fraud Scenario 1: Circular Resale (A→B→C→A) on record 1 ──────────────
    lr1_id = land_record_ids[0]
    fraud_transfers = [
        MutationEvent(land_record_id=lr1_id, from_owner="Anil Kumar Jain",
                      to_owner="Brijesh Sharma", transfer_price=800000,
                      transfer_date=datetime.now() - timedelta(days=120),
                      event_type=EventType.sale),
        MutationEvent(land_record_id=lr1_id, from_owner="Brijesh Sharma",
                      to_owner="Chetan Verma", transfer_price=950000,
                      transfer_date=datetime.now() - timedelta(days=90),
                      event_type=EventType.sale),
        MutationEvent(land_record_id=lr1_id, from_owner="Chetan Verma",
                      to_owner="Anil Kumar Jain", transfer_price=1100000,
                      transfer_date=datetime.now() - timedelta(days=60),
                      event_type=EventType.sale),
    ]
    db.add_all(fraud_transfers)

    f1 = FraudFlag(
        land_record_id=lr1_id,
        flag_type=FlagType.circular_resale,
        severity=Severity.critical,
        description="Circular resale detected: Anil Kumar Jain → Brijesh Sharma → Chetan Verma → Anil Kumar Jain within 60 days. Possible money laundering / title washing.",
        evidence_json={
            "cycle": ["Anil Kumar Jain", "Brijesh Sharma", "Chetan Verma"],
            "duration_days": 60,
            "transactions": [
                {"from": "Anil Kumar Jain", "to": "Brijesh Sharma", "price": 800000, "days_ago": 120},
                {"from": "Brijesh Sharma", "to": "Chetan Verma", "price": 950000, "days_ago": 90},
                {"from": "Chetan Verma", "to": "Anil Kumar Jain", "price": 1100000, "days_ago": 60},
            ],
        },
        is_resolved=False,
    )
    db.add(f1)

    # ── Fraud Scenario 2: Price Inflation (300%+ in 90 days) on record 2 ──────
    lr2_id = land_record_ids[1]
    inflation_transfers = [
        MutationEvent(land_record_id=lr2_id, from_owner="Dev Prakash",
                      to_owner="Esha Rani", transfer_price=200000,
                      transfer_date=datetime.now() - timedelta(days=95),
                      event_type=EventType.sale),
        MutationEvent(land_record_id=lr2_id, from_owner="Esha Rani",
                      to_owner="Farhan Siddiqui", transfer_price=900000,
                      transfer_date=datetime.now() - timedelta(days=15),
                      event_type=EventType.sale),
    ]
    db.add_all(inflation_transfers)

    f2 = FraudFlag(
        land_record_id=lr2_id,
        flag_type=FlagType.price_inflation,
        severity=Severity.high,
        description="Price inflated 350% (₹2L → ₹9L) in 80 days. Suspicious flip — potential benami transaction or inflated stamp duty evasion.",
        evidence_json={
            "chain": ["Dev Prakash", "Esha Rani", "Farhan Siddiqui"],
            "initial_price": 200000,
            "final_price": 900000,
            "inflation_pct": 350,
            "days": 80,
        },
        is_resolved=False,
    )
    db.add(f2)

    # ── RCCMS litigation flag on record 3 ─────────────────────────────────────
    lr3_id = land_record_ids[2]
    f3 = FraudFlag(
        land_record_id=lr3_id,
        flag_type=FlagType.rccms_litigation,
        severity=Severity.medium,
        description="Property owner matched against active RCCMS case C.S. 2022/003 — title dispute. Blockchain lock blocked pending verifier acknowledgment.",
        evidence_json={"case_number": "C.S. 2022/003", "match_score": 91.4},
        is_resolved=False,
    )
    db.add(f3)

    await db.commit()
    print("✅ Seeding complete — 3 users, 20 govt records, 20 court cases, 15 land records, fraud scenarios seeded.")
