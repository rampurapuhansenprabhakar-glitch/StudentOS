from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class TrendPoint(BaseModel):
    label: str
    value: float

class OverviewAnalyticsResponse(BaseModel):
    current_cgpa: Optional[float]
    target_cgpa: Optional[float]
    predicted_cgpa: Optional[float]
    overall_attendance: float
    assignment_completion_rate: float
    average_daily_study_hours: float
    study_consistency_score: float
    total_dsa_solved: int
    active_recommendations_count: int
    academic_risk_level: str
    academic_performance_trend: List[TrendPoint]
    attendance_trend: List[TrendPoint]
    study_hours_trend: List[TrendPoint]
    subject_marks_comparison: List[Dict[str, Any]]
    key_insights: List[str]
