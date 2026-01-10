from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from sqlmodel import Session, select
from typing import List
from datetime import datetime
import os
from database import get_session
from models import Application, TimelineEvent, User
from dependencies import get_current_user
from scraper import fetch_job_description, extract_job_metadata

router = APIRouter(tags=["applications"])

@router.post("/fetch-jd")
async def get_jd(url: str = Form(...)): 
    # fetch_job_description is synchronous and IO bound (requests). 
    description = await run_in_threadpool(fetch_job_description, url)
    # Extract metadata
    metadata = extract_job_metadata(description)
    return {
        "job_description": description,
        "company": metadata.get("company", ""),
        "role": metadata.get("role", "")
    }

@router.get("/applications", response_model=List[Application])
async def get_applications(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    result = await session.exec(select(Application).where(Application.user_id == current_user.id))
    applications = result.all()
    return applications

@router.post("/applications", response_model=Application)
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
    
    # file write is blocking sync IO usually. 
    # Use await resume.read() (async). 
    # write is sync. 
    content = await resume.read()
    with open(file_location, "wb+") as file_object:
        file_object.write(content)

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
    await session.commit()
    await session.refresh(application)
    return application

@router.delete("/applications/{application_id}")
async def delete_application(
    application_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    app = await session.get(Application, application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Delete file if exists (optional, safely)
    if app.resume_path and os.path.exists(app.resume_path):
        try:
            os.remove(app.resume_path)
        except:
            pass
            
    await session.delete(app)
    await session.commit()
    return {"ok": True}

@router.patch("/applications/{application_id}/status")
async def update_status(
    application_id: int, 
    status: str = Form(...), 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    app = await session.get(Application, application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    
    old_status = app.status
    app.status = status
    session.add(app)
    
    # Add Timeline Event
    event = TimelineEvent(application_id=app.id, title="Status Change", description=f"Status changed from {old_status} to {status}")
    session.add(event)
    
    await session.commit()
    await session.refresh(app)
    return app

@router.get("/applications/{application_id}/timeline", response_model=List[TimelineEvent])
async def get_timeline(
    application_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify ownership
    app = await session.get(Application, application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    result = await session.exec(select(TimelineEvent).where(TimelineEvent.application_id == application_id).order_by(TimelineEvent.date.desc()))
    events = result.all()
    return events

@router.post("/applications/{application_id}/timeline")
async def add_timeline_event(
    application_id: int, 
    title: str = Form(...), 
    description: str = Form(None), 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify ownership
    app = await session.get(Application, application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    event = TimelineEvent(application_id=application_id, title=title, description=description)
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event
