from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user
from app.services.digital_twin_service import DigitalTwinService
from app.ml.artifact_loader import model_loader

router = APIRouter(prefix="/predictions", tags=["ML Predictions"])

@router.post("/performance")
def predict_performance(
    custom_features: Optional[Dict[str, Any]] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not custom_features:
        state = DigitalTwinService.compute_student_state(user, db)
        features = state["derived_features"]
    else:
        features = custom_features

    pred, meta = model_loader.predict_performance(features)
    return {
        "predicted_next_cgpa": pred,
        "target_metric": "CGPA (0.0 to 10.0 scale)",
        "prediction_horizon": "Next Academic Semester",
        "model_metadata": meta,
        "disclaimer": "Analytical projection based on historical patterns and study behavior. Not a guarantee."
    }

@router.post("/risk")
def predict_risk(
    custom_features: Optional[Dict[str, Any]] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not custom_features:
        state = DigitalTwinService.compute_student_state(user, db)
        features = state["derived_features"]
    else:
        features = custom_features

    level, prob, meta = model_loader.predict_risk(features)
    return {
        "risk_level": level,
        "risk_probability": prob,
        "model_metadata": meta,
        "supportive_guidance": "Early intervention alert designed to assist time-management and targeted revision."
    }

@router.get("/metadata")
def get_ml_metadata():
    return model_loader.get_metadata()
