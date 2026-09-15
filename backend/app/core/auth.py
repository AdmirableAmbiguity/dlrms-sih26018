from datetime import datetime, timedelta
from typing import Optional, Any
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
# Note: we will need to import models here once created. Using a placeholder for type hinting or string for now.
# from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

ALGORITHM = "HS256"

def create_access_token(subject: str | Any, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        token_data = payload.get("sub")
        return token_data
    except JWTError:
        return None

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
):
    from app.models.user import User
    
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.id == int(token_data)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def require_role(required_role: str):
    async def role_dependency(current_user = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Requires {required_role} role."
            )
        return current_user
    return role_dependency

require_citizen = require_role("citizen")
require_revenue_officer = require_role("revenue_officer")
require_admin = require_role("verifier_admin")

async def mock_generate_otp(redis_client, phone_or_email: str) -> str:
    # Generates a 6-digit OTP and stores in Redis with a 5-min TTL
    otp = "123456" # Mock OTP
    await redis_client.setex(f"otp:{phone_or_email}", 300, otp)
    return otp

async def mock_verify_otp(redis_client, phone_or_email: str, otp: str) -> bool:
    stored_otp = await redis_client.get(f"otp:{phone_or_email}")
    if stored_otp and stored_otp.decode("utf-8") == otp:
        await redis_client.delete(f"otp:{phone_or_email}")
        return True
    return False
