import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, Field

class StudyPlanSessionCreate(BaseModel):
    subject_id: Optional[str] = None
    subject_name: str
    date: dt.date
    start_time: Optional[str] = "18:00"
    duration_hours: float = Field(..., gt=0.0, le=12.0)
    topic: Optional[str] = None
    notes: Optional[str] = None

class StudyPlanSessionResponse(BaseModel):
    id: str
    plan_id: str
    subject_id: Optional[str]
    subject_name: str
    date: dt.date
    start_time: Optional[str]
    duration_hours: float
    topic: Optional[str]
    is_completed: bool
    notes: Optional[str]
    created_at: dt.datetime

    class Config:
        from_attributes = True

class StudyPlanCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    start_date: dt.date = Field(default_factory=dt.date.today)
    end_date: dt.date
    available_hours_per_day: float = Field(default=3.0, gt=0.0, le=16.0)
    selected_subject_ids: Optional[List[str]] = None
    focus_weak_subjects: bool = True
    exam_prep_mode: bool = False

class StudyPlanResponse(BaseModel):
    id: str
    user_id: str
    title: str
    start_date: dt.date
    end_date: dt.date
    total_planned_hours: float
    status: str
    sessions: List[StudyPlanSessionResponse] = []
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True
