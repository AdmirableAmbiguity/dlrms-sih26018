from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any

from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.core.auth import create_access_token, get_current_user, mock_generate_otp, mock_verify_otp
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, OTPRequest, OTPVerifyRequest, TokenResponse, UserCreate, UserOut
import redis.asyncio as redis
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
redis_client = redis.from_url(settings.REDIS_URL)

@router.post("/register", response_model=UserOut)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check existing user
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        aadhaar_number=user_in.aadhaar_number
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_id": user.id,
        "role": user.role
    }

@router.post("/otp/send")
async def send_otp(req: OTPRequest):
    from app.services.sms.sms_service import send_real_sms_otp
    success, message = await send_real_sms_otp(req.phone_or_email)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message}

@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(req: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    from app.services.sms.sms_service import verify_real_sms_otp
    is_valid, err_msg = await verify_real_sms_otp(req.phone_or_email, req.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)
        
    # Find or auto-register user for authenticated phone
    result = await db.execute(select(User).where((User.email == req.phone_or_email) | (User.aadhaar_number == req.phone_or_email)))
    user = result.scalars().first()
    
    if not user:
        # Create user record for verified mobile number
        user = User(
            email=f"{req.phone_or_email}@dlrms.gov.in",
            full_name=f"Verified Citizen ({req.phone_or_email[-4:]})",
            hashed_password=hash_password("oauth2_verified_session"),
            role="citizen",
            aadhaar_number=req.phone_or_email
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_id": user.id,
        "role": user.role
    }


@router.post("/google")
async def google_auth(payload: dict, db: AsyncSession = Depends(get_db)):
    """Authenticate with Google OAuth ID token"""
    import httpx
    credential = payload.get("credential")
    role = payload.get("role", "revenue_officer")
    
    if not credential:
        raise HTTPException(status_code=400, detail="Missing credential")
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}")
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google ID token")
            google_info = resp.json()
            
        email = google_info.get("email")
        name = google_info.get("name", "Google User")
        picture = google_info.get("picture")
        
        # Check or create user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user:
            user = User(
                email=email,
                full_name=name,
                hashed_password=hash_password("google_oauth2_verified"),
                role=role,
                aadhaar_number=None
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
        access_token = create_access_token(subject=user.id)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "role": user.role,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.full_name,
                "full_name": user.full_name,
                "picture": picture,
                "role": user.role
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

