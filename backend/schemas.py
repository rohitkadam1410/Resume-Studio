from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class SurveySubmit(BaseModel):
    email: str
    interested: bool
    willing_price: str
    feedback: Optional[str] = None

class EditsRequest(BaseModel):
    filename: str
    sections: List[Dict]

class SaveResumeRequest(BaseModel):
    filename: str
    original_text: str
    tailored_text: str
    tailored_sections: List[Dict]
    initial_score: Optional[int] = 0
    projected_score: Optional[int] = 0
    # Optional fields for auto-creating application
    company_name: Optional[str] = None
    job_role: Optional[str] = None
    job_description: Optional[str] = None
