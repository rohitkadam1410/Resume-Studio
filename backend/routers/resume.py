from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
from sqlmodel import Session, select
from datetime import datetime
import shutil
import os
import uuid
import json
from database import get_session
from models import SavedResume, UsageLog, Application, User
from dependencies import get_optional_user, get_current_user
from schemas import EditsRequest, SaveResumeRequest
from pdf_handler import pdf_to_docx
from tailor import analyze_gaps, generate_tailored_resume

router = APIRouter()

@router.get("/download/{filename}")
async def download_file(filename: str):
    # Security check: prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
         return {"error": "Invalid filename"}
         
    file_path = os.path.join(os.getcwd(), filename)
    if os.path.exists(file_path):
        media_type = 'application/pdf'
        if filename.endswith('.docx'):
            media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        return FileResponse(file_path, media_type=media_type, filename=filename)
    return {"error": "File not found"}

@router.get("/api/usage")
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
    
    result = await session.exec(select(UsageLog).where(
        UsageLog.ip_address == client_ip, 
        UsageLog.user_id == None,
        UsageLog.created_at >= today_start
    ))
    usage_count = len(result.all())
    
    remaining = max(0, 2 - usage_count)
    
    return {"usage_count": usage_count, "remaining": remaining, "is_unlimited": False}

@router.post("/analyze")
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
        result = await session.exec(select(UsageLog).where(
            UsageLog.ip_address == client_ip, 
            UsageLog.user_id == None,
            UsageLog.created_at >= today_start
        ))
        usage_count = len(result.all())
        
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
    await session.commit()

    # Create a unique session ID
    session_id = str(uuid.uuid4())[:8]
    
    # Save uploaded resume temporarily with session ID
    temp_pdf_path = f"temp_{session_id}_{resume.filename}"
    content = await resume.read()
    with open(temp_pdf_path, "wb") as buffer:
        buffer.write(content)
    
    # 1. Convert PDF to customizable format (DOCX)
    docx_path = await run_in_threadpool(pdf_to_docx, temp_pdf_path)
    
    # 2. Analyze gaps using LLM (Use PDF for reading text)
    analysis_result = await run_in_threadpool(analyze_gaps, docx_path, job_description, pdf_path=temp_pdf_path)
    
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

@router.post("/generate")
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
    tailored_docx_path = await run_in_threadpool(generate_tailored_resume, docx_path, request.sections)
    
    # extract just the filename for the download url
    filename = os.path.basename(tailored_docx_path)
    
    return {
        "message": "Resume tailored successfully", 
        "pdf_path": tailored_docx_path, 
        "download_url": f"http://localhost:8000/download/{filename}"
    }

@router.post("/api/resume/save")
async def save_resume(
    req: SaveResumeRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
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
    await session.commit()
    await session.refresh(saved_resume)
    
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
        await session.commit()
        await session.refresh(new_app)
        application_id = new_app.id
    
    return {
        "message": "Resume saved successfully", 
        "id": saved_resume.id,
        "application_id": application_id
    }

@router.get("/api/resume/{resume_id}")
async def get_resume(
    resume_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    resume = await session.get(SavedResume, resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
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

@router.patch("/api/resume/{resume_id}")
async def update_resume(
    resume_id: int,
    req: SaveResumeRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    resume = await session.get(SavedResume, resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    resume.tailored_text = req.tailored_text
    resume.tailored_sections_json = json.dumps(req.tailored_sections)
    
    session.add(resume)
    await session.commit()
    await session.refresh(resume)
    return {"message": "Resume updated successfully", "id": resume.id}
