import json
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.digital_twin import DigitalTwinSnapshot
from app.schemas.digital_twin import DigitalTwinResponse, SnapshotHistoryItem
from app.api.dependencies import get_current_user
from app.services.digital_twin_service import DigitalTwinService

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin Engine"])

@router.get("/current", response_model=DigitalTwinResponse)
def get_current_digital_twin(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    state = DigitalTwinService.compute_student_state(user, db)
    return DigitalTwinResponse(**state)

@router.get("/history", response_model=List[SnapshotHistoryItem])
def get_snapshot_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snapshots = db.query(DigitalTwinSnapshot).filter(
        DigitalTwinSnapshot.user_id == user.id
    ).order_by(DigitalTwinSnapshot.timestamp.desc()).limit(20).all()

    history = []
    for s in snapshots:
        features = {}
        try:
            features = json.loads(s.derived_features)
        except Exception:
            pass

        history.append(
            SnapshotHistoryItem(
                id=s.id,
                timestamp=s.timestamp,
                predicted_cgpa=s.predicted_cgpa,
                academic_risk_level=s.academic_risk_level,
                model_version=s.model_version,
                derived_features=features
            )
        )
    return history
