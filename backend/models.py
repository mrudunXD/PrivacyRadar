from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum

class InputType(str, Enum):
    EMAIL = "email"
    USERNAME = "username"
    PHONE = "phone"
    DOMAIN = "domain"

class ScanRequest(BaseModel):
    value: str
    type: InputType

class Breach(BaseModel):
    id: Optional[int] = None
    name: str
    date: str
    records: str
    severity: str
    data_types: List[str]
    change_url: Optional[str] = None
    has_passwords: bool = False

class RiskScore(BaseModel):
    total: int
    breakdown: Dict[str, int]

class ScanResult(BaseModel):
    scan_id: str
    status: str
    input: str
    type: str
    score: Optional[RiskScore] = None
    breaches: List[Breach] = []
    platforms_found: List[str] = []
    paste_hits: int = 0
    ahmia_hits: int = 0
    pii_found: Dict[str, bool] = {}
    exif_found: bool = False
    narrative: Optional[str] = None
    timestamp: str
