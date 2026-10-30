import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, Field

class SubjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    code: Optional[str] = None
    credits: int = Field(default=3, ge=1, le=10)
    semester: int = Field(default=1, ge=1, le=12)
    target_attendance: float = Field(default=75.0, ge=0.0, le=100.0)
    is_active: bool = True

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    credits: Optional[int] = None
    semester: Optional[int] = None
    target_attendance: Optional[float] = None
    is_active: Optional[bool] = None

class SubjectResponse(SubjectBase):
    id: str
    user_id: str
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True

class AssessmentBase(BaseModel):
    subject_id: str
    name: str = Field(..., min_length=1, max_length=150)
    assessment_type: str = Field(default="internal")
    date: dt.date
    marks_obtained: float = Field(..., ge=0.0)
    max_marks: float = Field(..., gt=0.0)
    weightage: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    notes: Optional[str] = None

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentUpdate(BaseModel):
    name: Optional[str] = None
    assessment_type: Optional[str] = None
    date: Optional[dt.date] = None
    marks_obtained: Optional[float] = None
    max_marks: Optional[float] = None
    weightage: Optional[float] = None
    notes: Optional[str] = None

class AssessmentResponse(AssessmentBase):
    id: str
    user_id: str
    percentage: float
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True

class SubjectPerformanceSummary(BaseModel):
    subject_id: str
    subject_name: str
    subject_code: Optional[str] = None
    credits: int
    average_percentage: float
    assessments_count: int
    attendance_percentage: float
    status: str # "Strong", "Moderate", "Needs Attention"

class AcademicOverviewResponse(BaseModel):
    current_cgpa: Optional[float] = None
    target_cgpa: Optional[float] = None
    overall_marks_average: float
    total_subjects: int
    total_assessments: int
    subject_summaries: List[SubjectPerformanceSummary]
    strong_subjects: List[str]
    weak_subjects: List[str]
