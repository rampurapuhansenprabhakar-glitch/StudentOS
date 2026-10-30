from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.study_plan import StudyPlan, StudyPlanSession
from app.schemas.study_plan import StudyPlanCreate, StudyPlanResponse, StudyPlanSessionResponse
from app.api.dependencies import get_current_user
from app.services.planner_service import PlannerService

router = APIRouter(prefix="/study-plans", tags=["Study Planner"])

@router.post("", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
def create_study_plan(
    plan_in: StudyPlanCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = PlannerService.generate_study_plan(user, plan_in, db)
    return plan

@router.get("", response_model=List[StudyPlanResponse])
def get_study_plans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plans = db.query(StudyPlan).filter(StudyPlan.user_id == user.id).order_by(StudyPlan.created_at.desc()).all()
    return plans

@router.get("/{plan_id}", response_model=StudyPlanResponse)
def get_study_plan(
    plan_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    return plan

@router.patch("/sessions/{session_id}/complete", response_model=StudyPlanSessionResponse)
def toggle_session_complete(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sess = db.query(StudyPlanSession).join(StudyPlan).filter(
        StudyPlanSession.id == session_id,
        StudyPlan.user_id == user.id
    ).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Study session not found")

    sess.is_completed = not sess.is_completed
    db.commit()
    db.refresh(sess)
    return sess
