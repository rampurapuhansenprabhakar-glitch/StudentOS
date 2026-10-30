import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, Field

class AttendanceRecordBase(BaseModel):
    subject_id: str
    classes_conducted: int = Field(..., ge=0)
    classes_attended: int = Field(..., ge=0)
    date: dt.date = Field(default_factory=dt.date.today)
    notes: Optional[str] = None

class AttendanceRecordCreate(AttendanceRecordBase):
    pass

class AttendanceRecordUpdate(BaseModel):
    classes_conducted: Optional[int] = Field(None, ge=0)
    classes_attended: Optional[int] = Field(None, ge=0)
    date: Optional[dt.date] = None
    notes: Optional[str] = None

class AttendanceRecordResponse(AttendanceRecordBase):
    id: str
    user_id: str
    subject_name: Optional[str] = None
    percentage: float
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True

class SubjectAttendanceSummary(BaseModel):
    subject_id: str
    subject_name: str
    subject_code: Optional[str] = None
    total_conducted: int
    total_attended: int
    total_missed: int
    percentage: float
    target_percentage: float
    status: str # "Above Target", "On Track", "Critical Warning"
    consecutive_classes_needed: int
    can_miss_classes: int

class OverallAttendanceSummary(BaseModel):
    overall_percentage: float
    total_conducted: int
    total_attended: int
    total_missed: int
    subjects_count: int
    subjects_below_threshold: int
    subjects: List[SubjectAttendanceSummary]

class TargetAttendanceCalculationRequest(BaseModel):
    classes_attended: int = Field(..., ge=0)
    classes_conducted: int = Field(..., ge=0)
    target_percentage: float = Field(default=75.0, ge=1.0, le=100.0)
    total_planned_classes: Optional[int] = Field(default=None, ge=0)

class TargetAttendanceCalculationResponse(BaseModel):
    current_percentage: float
    target_percentage: float
    is_target_met: bool
    consecutive_classes_needed: int
    can_miss_classes: int
    is_target_achievable: bool
    explanation: str
