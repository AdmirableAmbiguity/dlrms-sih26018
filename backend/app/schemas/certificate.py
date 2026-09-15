from pydantic import BaseModel
from typing import Optional

class CertificateRequest(BaseModel):
    land_record_id: int

class CertificateOut(BaseModel):
    download_url: str
    record_hash: str
    message: str
