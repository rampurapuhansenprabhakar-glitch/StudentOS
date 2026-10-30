from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class RecommendationBase(BaseModel):
    title: str
    reason: str
    evidence: str
    priority: str = "medium" # high, medium, low
    suggested_action: str
    expected_effort_hours: Optional[float] = None
    related_weakness: Optional[str] = None
    category: str = "academic"
    status: str = "active"

class RecommendationResponse(RecommendationBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RecommendationActionRequest(BaseModel):
    action: str = Field(..., pattern="^(accepted|dismissed|completed|active)$")
    notes: Optional[str] = None
