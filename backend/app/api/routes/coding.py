from datetime import datetime, date, timedelta, timezone
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.coding import CodingLog, StudentGoal
from app.schemas.coding import (
    CodingLogCreate, CodingLogUpdate, CodingLogResponse,
    StudentGoalCreate, StudentGoalUpdate, StudentGoalResponse,
    CodingAnalyticsResponse
)
from app.api.dependencies import get_current_user
from app.services.digital_twin_service import DigitalTwinService

router = APIRouter(prefix="/coding", tags=["Coding & DSA Tracker"])

@router.get("/logs", response_model=List[CodingLogResponse])
def get_coding_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(CodingLog).filter(CodingLog.user_id == user.id).order_by(CodingLog.date.desc()).all()

@router.post("/logs", response_model=CodingLogResponse, status_code=status.HTTP_201_CREATED)
def create_coding_log(
    log_in: CodingLogCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log = CodingLog(**log_in.model_dump(), user_id=user.id)
    db.add(log)
    db.commit()
    db.refresh(log)

    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return log

@router.delete("/logs/{log_id}", status_code=status.HTTP_200_OK)
def delete_coding_log(
    log_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log = db.query(CodingLog).filter(CodingLog.id == log_id, CodingLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Coding log not found")

    db.delete(log)
    db.commit()
    DigitalTwinService.sync_digital_twin_snapshot(user, db)
    return {"message": "Coding log deleted successfully"}

@router.get("/analytics", response_model=CodingAnalyticsResponse)
def get_coding_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(CodingLog).filter(CodingLog.user_id == user.id).order_by(CodingLog.date.asc()).all()

    total_attempted = len(logs)
    solved_logs = [l for l in logs if l.status == "Solved"]
    total_solved = len(solved_logs)
    solve_rate = round((total_solved / total_attempted * 100.0) if total_attempted > 0 else 0.0, 1)

    diff_map: Dict[str, int] = {"Easy": 0, "Medium": 0, "Hard": 0}
    topic_map: Dict[str, int] = {}
    platform_map: Dict[str, int] = {}
    tot_time_mins = 0

    for l in logs:
        tot_time_mins += l.time_spent_minutes
        platform_map[l.platform] = platform_map.get(l.platform, 0) + 1
        if l.status == "Solved":
            diff_map[l.difficulty] = diff_map.get(l.difficulty, 0) + 1
            topic_map[l.topic] = topic_map.get(l.topic, 0) + 1

    # Streak calculation
    active_dates = {l.date for l in logs}
    today = date.today()
    streak = 0
    check_d = today
    # If not logged today, check if active yesterday
    if check_d not in active_dates:
        check_d = today - timedelta(days=1)

    while check_d in active_dates:
        streak += 1
        check_d -= timedelta(days=1)

    # Weekly velocity (past 7 days)
    seven_days_ago = today - timedelta(days=7)
    weekly_velocity = len([l for l in solved_logs if l.date >= seven_days_ago])

    return CodingAnalyticsResponse(
        total_problems_solved=total_solved,
        total_problems_attempted=total_attempted,
        solve_rate_percentage=solve_rate,
        current_streak_days=streak,
        difficulty_breakdown=diff_map,
        topic_breakdown=topic_map,
        platform_breakdown=platform_map,
        total_time_spent_hours=round(tot_time_mins / 60.0, 1),
        weekly_velocity=weekly_velocity
    )

@router.get("/goals", response_model=List[StudentGoalResponse])
def get_goals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.query(StudentGoal).filter(StudentGoal.user_id == user.id).all()
    resp = []
    for g in goals:
        pct = round((g.current_value / g.target_value * 100.0) if g.target_value > 0 else 0.0, 1)
        resp.append(
            StudentGoalResponse(
                id=g.id,
                user_id=g.user_id,
                title=g.title,
                goal_type=g.goal_type,
                target_value=g.target_value,
                current_value=g.current_value,
                unit=g.unit,
                deadline=g.deadline,
                is_completed=g.is_completed,
                progress_percentage=min(100.0, max(0.0, pct)),
                created_at=g.created_at,
                updated_at=g.updated_at
            )
        )
    return resp

@router.post("/goals", response_model=StudentGoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: StudentGoalCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = StudentGoal(**goal_in.model_dump(), user_id=user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)

    pct = round((goal.current_value / goal.target_value * 100.0) if goal.target_value > 0 else 0.0, 1)
    return StudentGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        title=goal.title,
        goal_type=goal.goal_type,
        target_value=goal.target_value,
        current_value=goal.current_value,
        unit=goal.unit,
        deadline=goal.deadline,
        is_completed=goal.is_completed,
        progress_percentage=min(100.0, max(0.0, pct)),
        created_at=goal.created_at,
        updated_at=goal.updated_at
    )

@router.patch("/goals/{goal_id}", response_model=StudentGoalResponse)
def update_goal(
    goal_id: str,
    goal_in: StudentGoalUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(StudentGoal).filter(StudentGoal.id == goal_id, StudentGoal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field, val in goal_in.model_dump(exclude_unset=True).items():
        setattr(goal, field, val)

    if goal.current_value >= goal.target_value:
        goal.is_completed = True

    db.commit()
    db.refresh(goal)

    pct = round((goal.current_value / goal.target_value * 100.0) if goal.target_value > 0 else 0.0, 1)
    return StudentGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        title=goal.title,
        goal_type=goal.goal_type,
        target_value=goal.target_value,
        current_value=goal.current_value,
        unit=goal.unit,
        deadline=goal.deadline,
        is_completed=goal.is_completed,
        progress_percentage=min(100.0, max(0.0, pct)),
        created_at=goal.created_at,
        updated_at=goal.updated_at
    )

@router.delete("/goals/{goal_id}", status_code=status.HTTP_200_OK)
def delete_goal(
    goal_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(StudentGoal).filter(StudentGoal.id == goal_id, StudentGoal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}
