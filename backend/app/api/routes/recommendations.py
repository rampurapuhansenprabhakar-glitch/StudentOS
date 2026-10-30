from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.recommendation import Recommendation
from app.schemas.recommendation import RecommendationResponse, RecommendationActionRequest
from app.api.dependencies import get_current_user
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Personalized Recommendations"])

@router.get("", response_model=List[RecommendationResponse])
def get_recommendations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recs = RecommendationService.generate_recommendations_for_student(user, db)
    return recs

@router.post("/{recommendation_id}/actions", response_model=RecommendationResponse)
def perform_recommendation_action(
    recommendation_id: str,
    action_in: RecommendationActionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id,
        Recommendation.user_id == user.id
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = action_in.action
    db.commit()
    db.refresh(rec)
    return rec
