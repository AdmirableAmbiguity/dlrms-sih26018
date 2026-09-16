from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "DLRMS (Intelligent Land Record Digitization & Validation System)"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://dlrms:dlrms@localhost:5432/dlrms"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str = "supersecretkey_change_in_production_1234567890"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # API Keys & SMS Gateway Configuration
    SARVAM_API_KEY: str = "sk_gae8vqjb_z3gXU0eToDYfK2iOsr8ErgN9"
    SMS_PROVIDER: str = "twilio_verify"  # "twilio_verify" | "twilio_sms" | "msg91" | "fast2sms"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_VERIFY_SERVICE_SID: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    MSG91_AUTH_KEY: str = ""
    MSG91_TEMPLATE_ID: str = ""
    FAST2SMS_API_KEY: str = ""
    
    # Blockchain
    BLOCKCHAIN_RPC_URL: str = "http://localhost:8545"
    CONTRACT_ADDRESS: str = "0x0000000000000000000000000000000000000000"
    DEPLOYER_PRIVATE_KEY: str = ""
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    
    # Environment
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")


settings = Settings()
