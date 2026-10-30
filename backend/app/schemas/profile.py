from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class StudentProfileBase(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)
    institution: Optional[str] = None
    degree: Optional[str] = "B.Tech"
    branch: Optional[str] = "Computer Science & Engineering (AIML)"
    current_year: Optional[int] = Field(default=3, ge=1, le=6)
    current_semester: Optional[int] = Field(default=6, ge=1, le=12)
    expected_graduation_year: Optional[int] = Field(default=2027, ge=2020, le=2040)
    current_cgpa: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    previous_semester_cgpa: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    target_cgpa: Optional[float] = Field(default=9.0, ge=0.0, le=10.0)
    preferred_study_hours_per_day: Optional[float] = Field(default=3.0, ge=0.0, le=24.0)
    primary_career_goal: Optional[str] = "AI/ML Engineer"
    preferred_programming_language: Optional[str] = "Python"
    technical_skill_level: Optional[str] = "Intermediate"
    weak_subjects: Optional[str] = None
    strong_subjects: Optional[str] = None

class StudentProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    institution: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    current_year: Optional[int] = None
    current_semester: Optional[int] = None
    expected_graduation_year: Optional[int] = None
    current_cgpa: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    previous_semester_cgpa: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    target_cgpa: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    preferred_study_hours_per_day: Optional[float] = Field(default=None, ge=0.0, le=24.0)
    primary_career_goal: Optional[str] = None
    preferred_programming_language: Optional[str] = None
    technical_skill_level: Optional[str] = None
    weak_subjects: Optional[str] = None
    strong_subjects: Optional[str] = None

class OnboardingSubjectInput(BaseModel):
    name: str
    code: Optional[str] = None
    credits: int = 3
    target_attendance: float = 75.0
    initial_conducted: int = 0
    initial_attended: int = 0

class OnboardingRequest(BaseModel):
    # Step 1: Profile
    display_name: str
    institution: Optional[str] = None
    degree: Optional[str] = "B.Tech"
    branch: Optional[str] = "Computer Science & Engineering (AIML)"
    current_year: int = 3
    current_semester: int = 6
    expected_graduation_year: int = 2027
    current_cgpa: Optional[float] = None
    previous_semester_cgpa: Optional[float] = None
    target_cgpa: float = 9.0
    preferred_study_hours_per_day: float = 3.0
    primary_career_goal: str = "AI/ML Engineer"
    preferred_programming_language: str = "Python"
    technical_skill_level: str = "Intermediate"
    
    # Step 2: Subjects
    subjects: List[OnboardingSubjectInput] = []
    
    # Step 3: Preferences
    weak_subjects: Optional[str] = None
    strong_subjects: Optional[str] = None
    
    # Step 4: Skills
    initial_skills: List[str] = []

class StudentProfileResponse(StudentProfileBase):
    id: str
    user_id: str
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
