from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = Field(default=True)
    
    # Relationship
    applications: List["Application"] = Relationship(back_populates="user")
    saved_resumes: List["SavedResume"] = Relationship(back_populates="user")

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    company_name: str
    job_role: str
    job_link: Optional[str] = None
    date_applied: datetime = Field(default_factory=datetime.now)
    status: str = Field(default="Applied")
    job_description: Optional[str] = None
    resume_path: Optional[str] = None
    saved_resume_id: Optional[int] = Field(default=None, foreign_key="savedresume.id")
    
    # Relationship
    user: Optional[User] = Relationship(back_populates="applications")
    timeline_events: List["TimelineEvent"] = Relationship(back_populates="application")
    saved_resume: Optional["SavedResume"] = Relationship(back_populates="application")

class TimelineEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(foreign_key="application.id")
    date: datetime = Field(default_factory=datetime.now)
    title: str
    description: Optional[str] = None
    
    # Relationship
    application: Optional[Application] = Relationship(back_populates="timeline_events")

class SurveyResponse(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    interested: bool = Field(default=True)
    willing_price: str
    feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class SavedResume(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    filename: str
    original_text: str
    tailored_text: str
    tailored_sections_json: str # Storing the JSON structure as text
    initial_score: int = Field(default=0)
    projected_score: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    
    # Relationship
    user: Optional[User] = Relationship(back_populates="saved_resumes")
    application: Optional[Application] = Relationship(back_populates="saved_resume")

class UsageLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ip_address: str = Field(index=True)
    user_id: Optional[int] = Field(default=None, index=True)
    action: str = Field(default="tailor") # e.g. "tailor" or "generate"
    created_at: datetime = Field(default_factory=datetime.now)

# Update User model to include relationship
# We need to do this carefully if User is already defined above without this field.
# Since SQLModel resolves forward references, we might need to update User class or utilize the string forward reference we just added.

