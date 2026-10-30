import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator

class SubjectStudyDuration(BaseModel):
    subject_name: str
    duration_hours: float = Field(..., ge=0.0, le=24.0)

class DailyStudyLogBase(BaseModel):
    date: dt.date
    total_study_hours: float = Field(..., ge=0.0, le=24.0)
    sessions_count: int = Field(default=1, ge=1, le=20)
    revision_completed: bool = False
    assignment_work_completed: bool = False
    dsa_problems_attempted: int = Field(default=0, ge=0)
    dsa_problems_solved: int = Field(default=0, ge=0)
    coding_practice_hours: float = Field(default=0.0, ge=0.0, le=24.0)
    focus_rating: int = Field(default=3, ge=1, le=5)
    difficulty_rating: int = Field(default=3, ge=1, le=5)
    notes: Optional[str] = None
    subject_durations: Optional[List[SubjectStudyDuration]] = None

    @model_validator(mode="after")
    def validate_study_log(self):
        if self.dsa_problems_solved > self.dsa_problems_attempted:
            raise ValueError("Problems solved cannot exceed problems attempted.")
        if self.subject_durations:
            sum_durations = sum(s.duration_hours for s in self.subject_durations)
            if sum_durations > self.total_study_hours + 0.5:
                raise ValueError(
                    f"Sum of subject durations ({sum_durations}h) cannot exceed total study duration ({self.total_study_hours}h)."
                )
        if self.date > dt.date.today():
            raise ValueError("Cannot log actual study records for future dates.")
        return self

class DailyStudyLogCreate(DailyStudyLogBase):
    pass

class DailyStudyLogUpdate(BaseModel):
    total_study_hours: Optional[float] = Field(None, ge=0.0, le=24.0)
    sessions_count: Optional[int] = Field(None, ge=1, le=20)
    revision_completed: Optional[bool] = None
    assignment_work_completed: Optional[bool] = None
    dsa_problems_attempted: Optional[int] = Field(None, ge=0)
    dsa_problems_solved: Optional[int] = Field(None, ge=0)
    coding_practice_hours: Optional[float] = Field(None, ge=0.0, le=24.0)
    focus_rating: Optional[int] = Field(None, ge=1, le=5)
    difficulty_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    subject_durations: Optional[List[SubjectStudyDuration]] = None

class DailyStudyLogResponse(BaseModel):
    id: str
    user_id: str
    date: dt.date
    total_study_hours: float
    sessions_count: int
    revision_completed: bool
    assignment_work_completed: bool
    dsa_problems_attempted: int
    dsa_problems_solved: int
    coding_practice_hours: float
    focus_rating: int
    difficulty_rating: int
    notes: Optional[str] = None
    subject_durations: List[SubjectStudyDuration] = []
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True

class StudyDayTrend(BaseModel):
    date: str
    day_name: str
    study_hours: float
    coding_hours: float
    focus_rating: int
    has_record: bool

class SubjectTimeDistribution(BaseModel):
    subject_name: str
    total_hours: float
    percentage: float

class StudyAnalyticsResponse(BaseModel):
    total_days_logged: int
    average_daily_hours: float
    average_weekly_hours: float
    study_consistency_score: float # 0 - 100%
    average_focus_rating: float
    total_dsa_attempted: int
    total_dsa_solved: int
    total_coding_hours: float
    subject_distribution: List[SubjectTimeDistribution]
    daily_trends: List[StudyDayTrend]
    week_over_week_change: float # percentage change
