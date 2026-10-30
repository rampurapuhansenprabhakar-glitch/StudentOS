from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class AssignmentBase(BaseModel):
    subject_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    due_date: datetime
    estimated_duration_hours: Optional[float] = Field(default=2.0, ge=0.1, le=100.0)
    actual_duration_hours: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    priority: str = Field(default="medium") # low, medium, high, urgent
    status: str = Field(default="not_started") # not_started, in_progress, completed, overdue
    notes: Optional[str] = None

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    subject_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_duration_hours: Optional[float] = None
    actual_duration_hours: Optional[float] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class AssignmentResponse(AssignmentBase):
    id: str
    user_id: str
    subject_name: Optional[str] = None
    is_overdue: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkloadDay(BaseModel):
    date: str
    day_name: str
    assignments_count: int
    estimated_hours: float
    assignment_titles: List[str]

class AssignmentWorkloadResponse(BaseModel):
    total_active: int
    completed_count: int
    overdue_count: int
    completion_rate: float
    upcoming_7_days: List[WorkloadDay]
    total_estimated_hours_next_7_days: float
