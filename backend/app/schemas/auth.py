from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from app.models.user import UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OTPRequest(BaseModel):
    phone_or_email: str

class OTPVerifyRequest(BaseModel):
    phone_or_email: str
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.citizen
    aadhaar_number: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)
