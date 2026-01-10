from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
from database import init_db, get_session
from models import Application, TimelineEvent, User, SurveyResponse, SavedResume, UsageLog
from sqlmodel import Session, select
from datetime import datetime, timedelta
import shutil
import uvicorn
import os
import uuid
from dotenv import load_dotenv
from scraper import fetch_job_description
from pdf_handler import pdf_to_docx, docx_to_pdf
from tailor import analyze_gaps, generate_tailored_resume
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import JWTError, jwt
import re


# Load env variables from potential locations
load_dotenv() # current dir
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")) # LLM-Projects root?
# Actually cleaner to just try loading the specific path the user mentioned if possible, or just standard .env
load_dotenv("d:\\projects\\LLM-Projects\\.env")

# Authentication configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hash using direct bcrypt."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), 
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password using direct bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = session.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
    return user


async def get_optional_user(
    request: Request,
    session: Session = Depends(get_session)
) -> Optional[User]:
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return session.exec(select(User).where(User.email == email)).first()
    except Exception:
        return None

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> str:
    """
    Validate password strength.
    Returns None if valid, otherwise returns an error message.
    """
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    
    if len(password.encode("utf-8")) > 72:
        return "Password is too long (must be under 72 bytes)."
        
    if not any(char.isupper() for char in password):
        return "Password must contain at least one uppercase letter."
        
    if not any(char.islower() for char in password):
        return "Password must contain at least one lowercase letter."
        
    if not any(char.isdigit() for char in password):
        return "Password must contain at least one digit."
        
    if not any(char in "!@#$%^&*()_+-=[]{}|;:,.<>?" for char in password):
        return "Password must contain at least one special character (!@#$%^&* etc.)."
        
    return None

# Pydantic models for auth
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

from typing import List, Dict

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

# --- Authentication Endpoints ---

@app.post("/auth/register", response_model=Token)
def register(user: UserRegister, session: Session = Depends(get_session)):
    # Validate email format
    if not validate_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid email format"
        )
    
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == user.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    # Validate password strength
    error_message = validate_password(user.password)
    if error_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=error_message
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email, 
        hashed_password=hashed_password
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    # Generate JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
def login(user: UserLogin, session: Session = Depends(get_session)):
    # Validate password length (bcrypt limit is 72 bytes)
    if len(user.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )
    
    # Validate email format
    if not validate_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )
    
    # Check if user exists
    db_user = session.exec(select(User).where(User.email == user.email)).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )
    
    # Generate JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(os.getcwd(), filename)
    if os.path.exists(file_path):
        media_type = 'application/pdf'
        if filename.endswith('.docx'):
            media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        return FileResponse(file_path, media_type=media_type, filename=filename)
    return {"error": "File not found"}

class EditsRequest(BaseModel):
    filename: str
    sections: List[Dict]

@app.get("/api/usage")
async def check_usage(
    request: Request,
    session: Session = Depends(get_session)
):
    user = await get_optional_user(request, session)
    if user:
        return {"usage_count": 0, "remaining": 9999, "is_unlimited": True}
    
    client_ip = request.client.host
    # Calculate start of today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    usage_count = len(session.exec(select(UsageLog).where(
        UsageLog.ip_address == client_ip, 
        UsageLog.user_id == None,
        UsageLog.created_at >= today_start
    )).all())
    
    remaining = max(0, 2 - usage_count)
    
    return {"usage_count": usage_count, "remaining": remaining, "is_unlimited": False}

@app.post("/analyze")
async def analyze_resume(
    request: Request,
    resume: UploadFile = File(...), 
    job_description: str = Form(...),
    session: Session = Depends(get_session)
):
    # Usage Tracking Logic
    user = await get_optional_user(request, session)
    client_ip = request.client.host
    
    if not user:
        # Check anonymous usage limits (Daily)
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        usage_count = len(session.exec(select(UsageLog).where(
            UsageLog.ip_address == client_ip, 
            UsageLog.user_id == None,
            UsageLog.created_at >= today_start
        )).all())
        
        if usage_count >= 2:
            raise HTTPException(
                status_code=403, 
                detail="Daily free limit reached. Please login for unlimited access."
            )
        
    # Log usage
    new_log = UsageLog(
        ip_address=client_ip, 
        user_id=user.id if user else None,
        action="tailor"
    )
    session.add(new_log)
    session.commit()

    # Create a unique session ID
    session_id = str(uuid.uuid4())[:8]
    
    # Save uploaded resume temporarily with session ID
    temp_pdf_path = f"temp_{session_id}_{resume.filename}"
    with open(temp_pdf_path, "wb") as buffer:
        buffer.write(await resume.read())
    
    # 1. Convert PDF to customizable format (DOCX)
    docx_path = pdf_to_docx(temp_pdf_path)
    
    # 2. Analyze gaps using LLM (Use PDF for reading text)
    analysis_result = analyze_gaps(docx_path, job_description, pdf_path=temp_pdf_path)
    
    # We return the filename (with session ID) so the frontend can send it back for the next step
    return {
        "message": "Analysis complete", 
        "sections": analysis_result.get("sections", []),
        "initial_score": analysis_result.get("initial_score", 0),
        "projected_score": analysis_result.get("projected_score", 0),
        "company_name": analysis_result.get("company_name", "Unknown Company"),
        "job_title": analysis_result.get("job_title", "Unknown Role"),
        "filename": temp_pdf_path, # Returning the temp path as the handle
        "temp_docx_path": docx_path 
    }

@app.post("/generate")
async def generate_resume_endpoint(request: EditsRequest):
    # Reconstruct paths using the filename handle provided by frontend
    # 1. Try temp location first
    temp_pdf_path = request.filename
    docx_path = temp_pdf_path.replace(".pdf", ".docx")
    
    # 2. If not found, try saved_resumes location
    if not os.path.exists(docx_path):
        saved_docx_path = os.path.join("saved_resumes", os.path.basename(docx_path))
        if os.path.exists(saved_docx_path):
            docx_path = saved_docx_path
        else:
            return {"error": "Session expired or file not found. Please upload again."}
        
    # 3. Apply edits
    tailored_docx_path = generate_tailored_resume(docx_path, request.sections)
    
    # 4. Skip PDF conversion - Return DOCX directly
    # tailored_pdf_path = docx_to_pdf(tailored_docx_path)
    
    # extract just the filename for the download url
    filename = os.path.basename(tailored_docx_path)
    
    return {
        "message": "Resume tailored successfully", 
        "pdf_path": tailored_docx_path, # Keeping key 'pdf_path' for generic naming, or change to 'file_path' if frontend adapts
        "download_url": f"http://localhost:8000/download/{filename}"
    }

# --- Application Tracker Endpoints ---

@app.post("/fetch-jd")
def get_jd(url: str = Form(...), session: Session = Depends(get_session)): # Removed current_user dependency for public access
    description = fetch_job_description(url)
    # Extract metadata
    from scraper import extract_job_metadata
    metadata = extract_job_metadata(description)
    return {
        "job_description": description,
        "company": metadata.get("company", ""),
        "role": metadata.get("role", "")
    }

@app.get("/applications", response_model=List[Application])
def get_applications(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    applications = session.exec(select(Application).where(Application.user_id == current_user.id)).all()
    return applications

@app.post("/applications", response_model=Application)
async def create_application(
    company_name: str = Form(...),
    job_role: str = Form(...),
    job_link: str = Form(None),
    status: str = Form("Applied"),
    job_description: str = Form(None),
    resume: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Save resume specifically for this application
    os.makedirs("application_resumes", exist_ok=True)
    # create a unique filename to avoid collisions
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{resume.filename}"
    file_location = os.path.join("application_resumes", safe_filename)
    
    with open(file_location, "wb+") as file_object:
        file_object.write(await resume.read())

    application = Application(
        user_id=current_user.id,
        company_name=company_name,
        job_role=job_role,
        job_link=job_link,
        status=status,
        job_description=job_description,
        resume_path=file_location
    )
    session.add(application)
    session.commit()
    session.refresh(application)
    return application

@app.delete("/applications/{application_id}")
def delete_application(
    application_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    app = session.get(Application, application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Delete file if exists (optional, safely)
    if app.resume_path and os.path.exists(app.resume_path):
        try:
            os.remove(app.resume_path)
        except:
            pass
            
    session.delete(app)
    session.commit()
    return {"ok": True}

@app.patch("/applications/{application_id}/status")
def update_status(
    application_id: int, 
    status: str = Form(...), 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    app = session.get(Application, application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    
    old_status = app.status
    app.status = status
    session.add(app)
    
    # Add Timeline Event
    event = TimelineEvent(application_id=app.id, title="Status Change", description=f"Status changed from {old_status} to {status}")
    session.add(event)
    
    session.commit()
    session.refresh(app)
    return app

@app.get("/applications/{application_id}/timeline", response_model=List[TimelineEvent])
def get_timeline(
    application_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify ownership
    app = session.get(Application, application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    events = session.exec(select(TimelineEvent).where(TimelineEvent.application_id == application_id).order_by(TimelineEvent.date.desc())).all()
    return events

@app.post("/applications/{application_id}/timeline")
def add_timeline_event(
    application_id: int, 
    title: str = Form(...), 
    description: str = Form(None), 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify ownership
    app = session.get(Application, application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    event = TimelineEvent(application_id=application_id, title=title, description=description)
    session.add(event)
    session.commit()
    session.refresh(event)
    return event

@app.post("/api/survey")
def submit_survey(survey: SurveySubmit, session: Session = Depends(get_session)):
    new_response = SurveyResponse(
        email=survey.email,
        interested=survey.interested,
        willing_price=survey.willing_price,
        feedback=survey.feedback
    )
    session.add(new_response)
    session.commit()
    session.refresh(new_response)
    return {"message": "Survey submitted successfully", "id": new_response.id}

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

@app.post("/api/resume/save")
def save_resume(
    req: SaveResumeRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    import json
    
    # Persist the temp file to a permanent location
    os.makedirs("saved_resumes", exist_ok=True)
    temp_path = req.filename
    # Handle both PDF and DOCX versions
    temp_docx = temp_path.replace(".pdf", ".docx")
    
    saved_path = os.path.join("saved_resumes", req.filename)
    saved_docx_path = os.path.join("saved_resumes", req.filename.replace(".pdf", ".docx"))
    
    if os.path.exists(temp_path):
        shutil.copy2(temp_path, saved_path)
    if os.path.exists(temp_docx):
        shutil.copy2(temp_docx, saved_docx_path)

    saved_resume = SavedResume(
        user_id=current_user.id,
        filename=req.filename,
        original_text=req.original_text,
        tailored_text=req.tailored_text,
        tailored_sections_json=json.dumps(req.tailored_sections),
        initial_score=req.initial_score,
        projected_score=req.projected_score
    )
    session.add(saved_resume)
    session.commit()
    session.refresh(saved_resume)
    
    # Auto-create application if company/role provided
    application_id = None
    if req.company_name and req.job_role:
        new_app = Application(
            user_id=current_user.id,
            company_name=req.company_name,
            job_role=req.job_role,
            status="Started",
            job_description=req.job_description,
            saved_resume_id=saved_resume.id,
            resume_path=saved_path if os.path.exists(saved_path) else None 
        )
        session.add(new_app)
        session.commit()
        session.refresh(new_app)
        application_id = new_app.id
    
    return {
        "message": "Resume saved successfully", 
        "id": saved_resume.id,
        "application_id": application_id
    }

@app.get("/api/resume/{resume_id}")
def get_resume(
    resume_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    resume = session.get(SavedResume, resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    import json
    return {
        "id": resume.id,
        "filename": resume.filename,
        "original_text": resume.original_text,
        "tailored_text": resume.tailored_text,
        "tailored_sections": json.loads(resume.tailored_sections_json),
        "created_at": resume.created_at,
        "initial_score": resume.initial_score,
        "projected_score": resume.projected_score
    }

@app.patch("/api/resume/{resume_id}")
def update_resume(
    resume_id: int,
    req: SaveResumeRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    import json
    resume = session.get(SavedResume, resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    resume.tailored_text = req.tailored_text
    resume.tailored_sections_json = json.dumps(req.tailored_sections)
    
    session.add(resume)
    session.commit()
    session.refresh(resume)
    return {"message": "Resume updated successfully", "id": resume.id}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
