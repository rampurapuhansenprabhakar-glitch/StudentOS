from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class StudentSkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="Core CS")
    current_proficiency: float = Field(..., ge=0.0, le=100.0)
    target_proficiency: float = Field(default=80.0, ge=0.0, le=100.0)
    notes: Optional[str] = None

class StudentSkillCreate(StudentSkillBase):
    pass

class StudentSkillUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    current_proficiency: Optional[float] = Field(None, ge=0.0, le=100.0)
    target_proficiency: Optional[float] = Field(None, ge=0.0, le=100.0)
    notes: Optional[str] = None

class StudentSkillResponse(StudentSkillBase):
    id: str
    user_id: str
    skill_gap: float
    last_assessed_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SkillGapItem(BaseModel):
    skill_name: str
    category: str
    current_proficiency: float
    target_proficiency: float
    gap: float
    priority: str # "High", "Medium", "Low"

class CareerRoleRequirement(BaseModel):
    role_name: str
    description: str
    required_skills: List[dict] # [{"name": "Python", "min_proficiency": 80}]
    readiness_percentage: float
    matching_skills_count: int
    missing_skills: List[str]

class SkillGapAnalysisResponse(BaseModel):
    average_proficiency: float
    total_skills_tracked: int
    top_skill_gaps: List[SkillGapItem]
    career_role_readiness: List[CareerRoleRequirement]
