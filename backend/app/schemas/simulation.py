from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class SimulationParameters(BaseModel):
    daily_study_hours: Optional[float] = Field(None, ge=0.0, le=24.0)
    attendance_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    assignment_completion_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    internal_assessment_average: Optional[float] = Field(None, ge=0.0, le=100.0)
    coding_hours_per_day: Optional[float] = Field(None, ge=0.0, le=24.0)
    study_consistency: Optional[float] = Field(None, ge=0.0, le=100.0)

class SimulationRunRequest(BaseModel):
    scenario_name: Optional[str] = "What-If Scenario"
    parameters: SimulationParameters

class PredictionOutcome(BaseModel):
    predicted_cgpa: float
    risk_level: str # "Low", "Moderate", "High"
    risk_probability: float
    model_version: str

class SimulationImpact(BaseModel):
    cgpa_difference: float
    risk_difference: str
    key_drivers: List[str]
    disclaimer: str

class SimulationResult(BaseModel):
    scenario_name: str
    modified_parameters: Dict[str, Any]
    baseline_prediction: PredictionOutcome
    simulated_prediction: PredictionOutcome
    impact: SimulationImpact
    baseline_features: Dict[str, Any]
    simulated_features: Dict[str, Any]

class SimulationSaveRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    parameters: SimulationParameters
    simulation_result: SimulationResult

class SimulationScenarioResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    baseline_snapshot_id: Optional[str] = None
    modified_parameters: Dict[str, Any]
    baseline_prediction: Dict[str, Any]
    simulated_prediction: Dict[str, Any]
    impact_summary: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
