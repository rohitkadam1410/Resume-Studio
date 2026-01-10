from fastapi import APIRouter, Depends
from sqlmodel import Session
from database import get_session
from models import SurveyResponse
from schemas import SurveySubmit

router = APIRouter(prefix="/api/survey", tags=["survey"])

@router.post("")
async def submit_survey(survey: SurveySubmit, session: Session = Depends(get_session)):
    new_response = SurveyResponse(
        email=survey.email,
        interested=survey.interested,
        willing_price=survey.willing_price,
        feedback=survey.feedback
    )
    session.add(new_response)
    await session.commit()
    await session.refresh(new_response)
    return {"message": "Survey submitted successfully", "id": new_response.id}
