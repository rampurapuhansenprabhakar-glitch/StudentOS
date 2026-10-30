import datetime as dt
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class CodingLogBase(BaseModel):
    date: dt.date = Field(default_factory=dt.date.today)
    problem_title: str = Field(..., min_length=1, max_length=200)
    platform: str = Field(default="LeetCode")
    language: str = Field(default="Python")
    topic: str = Field(default="Arrays")
    difficulty: str = Field(default="Medium") # Easy, Medium, Hard
    status: str = Field(default="Solved") # Solved, Attempted, Review Needed
    time_spent_minutes: int = Field(default=30, ge=1, le=1440)
    confidence_rating: int = Field(default=3, ge=1, le=5)
    problem_url: Optional[str] = None
    notes: Optional[str] = None

class CodingLogCreate(CodingLogBase):
    pass

class CodingLogUpdate(BaseModel):
    problem_title: Optional[str] = None
    platform: Optional[str] = None
    language: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    status: Optional[str] = None
    time_spent_minutes: Optional[int] = Field(None, ge=1, le=1440)
    confidence_rating: Optional[int] = Field(None, ge=1, le=5)
    problem_url: Optional[str] = None
    notes: Optional[str] = None

class CodingLogResponse(CodingLogBase):
    id: str
    user_id: str
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True

class StudentGoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    goal_type: str = Field(default="cgpa") # cgpa, study_hours, dsa_count, skill_target, career
    target_value: float
    current_value: float = 0.0
    unit: str = ""
    deadline: Optional[dt.date] = None
    is_completed: bool = False

class StudentGoalCreate(StudentGoalBase):
    pass

class StudentGoalUpdate(BaseModel):
    title: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    deadline: Optional[dt.date] = None
    is_completed: Optional[bool] = None

class StudentGoalResponse(StudentGoalBase):
    id: str
    user_id: str
    progress_percentage: float
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True

class CodingAnalyticsResponse(BaseModel):
    total_problems_solved: int
    total_problems_attempted: int
    solve_rate_percentage: float
    current_streak_days: int
    difficulty_breakdown: Dict[str, int]
    topic_breakdown: Dict[str, int]
    platform_breakdown: Dict[str, int]
    total_time_spent_hours: float
    weekly_velocity: int
