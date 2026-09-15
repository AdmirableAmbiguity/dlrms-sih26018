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
    otp = await mock_generate_otp(redis_client, req.phone_or_email)
    return {"message": f"OTP sent (mock: {otp})"}

@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(req: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    is_valid = await mock_verify_otp(redis_client, req.phone_or_email, req.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    result = await db.execute(select(User).where(User.email == req.phone_or_email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_id": user.id,
        "role": user.role
    }

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
