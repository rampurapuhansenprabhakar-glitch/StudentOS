from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, ConfigDict

class AcademicState(BaseModel):
    current_cgpa: float
    previous_cgpa: float
    target_cgpa: float
    subjects_count: int
    internal_assessment_avg: float
    attendance_percentage: float
    backlogs: int

class BehavioralState(BaseModel):
    daily_study_hours: float
    study_consistency_score: float
    average_focus_rating: float
    days_logged_last_14_days: int
    assignment_completion_rate: float

class SkillState(BaseModel):
    skills_count: int
    average_proficiency: float
    career_goal: str

class CodingState(BaseModel):
    problems_solved: int
    coding_hours_per_week: float

class DigitalTwinResponse(BaseModel):
    user_id: str
    last_updated: datetime
    academic_state: AcademicState
    behavioral_state: BehavioralState
    skill_state: SkillState
    coding_state: CodingState
    derived_features: Dict[str, Any]
    predicted_cgpa: Optional[float] = None
    academic_risk_level: str
    academic_risk_probability: Optional[float] = None
    model_version: str
    data_completeness_percentage: float

    model_config = ConfigDict(from_attributes=True)

class SnapshotHistoryItem(BaseModel):
    id: str
    timestamp: datetime
    predicted_cgpa: Optional[float] = None
    academic_risk_level: str
    model_version: str
    derived_features: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)
